// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ArcToken.sol";
import "./ArcBondingCurveAMM.sol";

/**
 * @notice Interface for the ARC staking contract to query fee discounts.
 * Same interface as used by ArcMarketplace for compatibility with both
 * ArcStaking (v0.1, returns uint256) and StakingRewards (v0.2, returns uint16).
 */
interface IArcStaking {
    function getFeeDiscount(address user) external view returns (uint256);
}

/**
 * @title ArcTokenFactory - USDC-Native Token Launcher
 * @dev Factory contract for deploying tokens with bonding curves on Arc chain.
 * Integrated with ARC marketplace fee structure and staking discounts.
 *
 * Features:
 * - Deploy new ERC20 tokens with bonding curve AMMs
 * - Creation fee in USDC ($25 default), discounted for stakers
 * - CREATE2 for deterministic token addresses
 * - Rate limiting (1 min cooldown between creations)
 * - Pausable for emergency stop
 */
contract ArcTokenFactory is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ========== STATE ==========
    IERC20 public immutable usdc;
    address public stakingContract;
    address public feeVault;

    enum CurveType { LINEAR, EXPONENTIAL }

    struct TokenConfig {
        string name;
        string symbol;
        string description;
        string imageUrl;
        uint256 totalSupply;
        uint256 basePrice;          // Price in USDC (6 decimals)
        uint256 slope;              // Bonding curve slope
        CurveType curveType;
        uint256 graduationThreshold;
        address creator;
        uint256 createdAt;
    }

    mapping(address => bool) public isArcToken;
    mapping(address => TokenConfig) public tokenConfigs;
    mapping(address => address) public tokenToAMM;
    address[] public allTokens;

    // Fee structure
    uint256 public constant CREATION_FEE_USDC = 25e6;  // $25 USDC (6 decimals)

    // Rate limiting
    mapping(address => uint256) public lastTokenCreation;
    uint256 public constant CREATION_COOLDOWN = 60;     // 1 minute

    // Safety limits
    uint256 public constant MAX_TOTAL_SUPPLY = 1e12 * 1e18;
    uint256 public constant MIN_TOTAL_SUPPLY = 1e18;

    // ========== EVENTS ==========
    event TokenCreated(
        address indexed tokenAddress,
        address indexed ammAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint256 creationFeeUSDC,
        uint256 timestamp
    );

    event CreationFeeCollected(
        address indexed creator,
        uint256 amountUSDC,
        uint256 discountBps
    );

    event StakingContractUpdated(
        address indexed oldContract,
        address indexed newContract
    );

    event FeeVaultUpdated(
        address indexed oldVault,
        address indexed newVault
    );

    // ========== ERRORS ==========
    error InvalidInput(string param);
    error ZeroAddress();
    error RateLimitExceeded();
    error DeploymentFailed();

    // ========== CONSTRUCTOR ==========
    constructor(
        address _usdc,
        address _stakingContract,
        address _feeVault
    ) Ownable(msg.sender) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_feeVault == address(0)) revert ZeroAddress();
        // _stakingContract can be address(0) initially

        usdc = IERC20(_usdc);
        stakingContract = _stakingContract;
        feeVault = _feeVault;
    }

    // ========== MAIN FUNCTION ==========
    /**
     * @dev Create a new token with bonding curve AMM
     * @notice Requires USDC approval for creation fee.
     * Creation fee is discounted for ARC stakers.
     */
    function createToken(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _imageUrl,
        uint256 _totalSupply,
        uint256 _basePrice,
        uint256 _slope,
        CurveType _curveType
    ) external nonReentrant whenNotPaused returns (address tokenAddress, address ammAddress) {
        // ========== RATE LIMITING ==========
        if (block.timestamp < lastTokenCreation[msg.sender] + CREATION_COOLDOWN) {
            revert RateLimitExceeded();
        }

        // ========== INPUT VALIDATION ==========
        if (bytes(_name).length == 0 || bytes(_name).length > 50) {
            revert InvalidInput("name");
        }
        if (bytes(_symbol).length == 0 || bytes(_symbol).length > 10) {
            revert InvalidInput("symbol");
        }
        if (_totalSupply < MIN_TOTAL_SUPPLY || _totalSupply > MAX_TOTAL_SUPPLY) {
            revert InvalidInput("totalSupply");
        }
        if (_basePrice == 0) {
            revert InvalidInput("basePrice");
        }

        // ========== STAKER DISCOUNT CALCULATION ==========
        uint256 creationFee = CREATION_FEE_USDC;
        uint256 discountBps = 0;

        if (stakingContract != address(0)) {
            try IArcStaking(stakingContract).getFeeDiscount(msg.sender) returns (uint256 discount) {
                // Cap discount at 50% (5000 bps) to prevent fee elimination
                if (discount > 5000) discount = 5000;
                discountBps = discount;
                creationFee = creationFee - ((creationFee * discount) / 10000);
            } catch {
                // Staking call failed — use full fee
            }
        }

        // ========== FEE COLLECTION ==========
        usdc.safeTransferFrom(msg.sender, feeVault, creationFee);
        emit CreationFeeCollected(msg.sender, creationFee, discountBps);

        // ========== DEPLOYMENT ==========
        uint256 graduationThreshold = (_totalSupply * 80) / 100;

        tokenAddress = _deployToken(_name, _symbol, _totalSupply);
        ammAddress = _deployAMM(
            tokenAddress,
            msg.sender,
            _basePrice,
            _slope,
            _curveType,
            graduationThreshold
        );

        // ========== STATE UPDATES ==========
        tokenConfigs[tokenAddress] = TokenConfig({
            name: _name,
            symbol: _symbol,
            description: _description,
            imageUrl: _imageUrl,
            totalSupply: _totalSupply,
            basePrice: _basePrice,
            slope: _slope,
            curveType: _curveType,
            graduationThreshold: graduationThreshold,
            creator: msg.sender,
            createdAt: block.timestamp
        });

        isArcToken[tokenAddress] = true;
        tokenToAMM[tokenAddress] = ammAddress;
        allTokens.push(tokenAddress);
        lastTokenCreation[msg.sender] = block.timestamp;

        // Transfer entire token supply to AMM
        ArcToken(tokenAddress).transfer(ammAddress, _totalSupply);

        emit TokenCreated(
            tokenAddress,
            ammAddress,
            msg.sender,
            _name,
            _symbol,
            _totalSupply,
            creationFee,
            block.timestamp
        );

        return (tokenAddress, ammAddress);
    }

    // ========== INTERNAL FUNCTIONS ==========

    function _deployToken(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) internal returns (address) {
        bytes32 salt = keccak256(
            abi.encodePacked(_name, _symbol, msg.sender, block.timestamp)
        );
        bytes memory bytecode = abi.encodePacked(
            type(ArcToken).creationCode,
            abi.encode(_name, _symbol, _totalSupply, address(this))
        );

        address tokenAddress;
        assembly {
            tokenAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        if (tokenAddress == address(0)) revert DeploymentFailed();
        return tokenAddress;
    }

    function _deployAMM(
        address _tokenAddress,
        address _creator,
        uint256 _basePrice,
        uint256 _slope,
        CurveType _curveType,
        uint256 _graduationThreshold
    ) internal returns (address) {
        ArcBondingCurveAMM amm = new ArcBondingCurveAMM(
            _tokenAddress,
            _creator,
            _basePrice,
            _slope,
            uint8(_curveType),
            _graduationThreshold,
            feeVault,
            address(usdc)
        );
        return address(amm);
    }

    // ========== VIEW FUNCTIONS ==========

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getTotalTokens() external view returns (uint256) {
        return allTokens.length;
    }

    function getTokenConfig(address _tokenAddress) external view returns (TokenConfig memory) {
        return tokenConfigs[_tokenAddress];
    }

    function getTokenAMM(address _tokenAddress) external view returns (address) {
        return tokenToAMM[_tokenAddress];
    }

    // ========== ADMIN FUNCTIONS ==========

    function updateFeeVault(address _newVault) external onlyOwner {
        if (_newVault == address(0)) revert ZeroAddress();
        address oldVault = feeVault;
        feeVault = _newVault;
        emit FeeVaultUpdated(oldVault, _newVault);
    }

    function updateStakingContract(address _newStaking) external onlyOwner {
        address oldStaking = stakingContract;
        stakingContract = _newStaking;
        emit StakingContractUpdated(oldStaking, _newStaking);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
