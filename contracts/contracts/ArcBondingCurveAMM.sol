// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ArcBondingCurveAMM - Production Grade Token Launcher
 * @dev Automated Market Maker with bonding curve pricing + USDC settlement
 * @notice Arc-native implementation:
 * - All pricing and settlement in USDC (6 decimals)
 * - No native currency support (no msg.value)
 * - Graduation: 50% creator / 25% staking rewards / 25% platform
 * - Time-weighted staking rewards (365 days distribution)
 * - No DEX integration (Arc has no DEX yet)
 */
contract ArcBondingCurveAMM is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ========== IMMUTABLE STATE ==========
    IERC20 public immutable token;              // Token created by factory (18 decimals)
    IERC20 public immutable usdc;               // USDC stablecoin (6 decimals)
    address public immutable tokenCreator;      // Token creator (receives 50% at graduation)
    address public immutable feeVault;          // ARC platform fee recipient

    uint256 public immutable basePrice;         // Starting price (in USDC, 6 decimals)
    uint256 public immutable slope;             // Bonding curve slope parameter
    uint8 public immutable curveType;           // 0 = LINEAR, 1 = EXPONENTIAL
    uint256 public immutable graduationThreshold; // Supply threshold to graduate

    // ========== MUTABLE STATE ==========
    uint256 public currentSupply;               // Tokens sold so far
    uint256 public totalVolume;                 // Total USDC volume traded
    bool public isGraduated;                    // Has token graduated?

    // Graduation state (only populated when graduated)
    struct GraduationReserves {
        uint256 creatorReserve;                 // 50% of USDC at graduation
        uint256 stakingRewardPool;              // 25% for staking rewards
        uint256 platformFee;                    // 25% to platform (already transferred)
        uint256 graduatedAt;                    // Timestamp of graduation
    }
    GraduationReserves public reserves;

    // Staking rewards tracking (post-graduation)
    mapping(address => uint256) public tokenStaked;
    mapping(address => uint256) public stakingStartTime;
    mapping(address => uint256) public rewardsClaimed;      // Track claimed rewards per user
    uint256 public totalTokenStaked;
    uint256 public totalRewardsClaimed;                     // Track total claimed from pool

    // ========== CONSTANTS ==========
    uint256 public constant PRECISION = 1e18;               // Token math precision
    uint256 public constant USDC_DECIMALS = 1e6;            // USDC is 6 decimals

    // Platform fees (basis points)
    uint256 public constant PLATFORM_FEE_BPS = 250;         // 2.5%

    // Bonding curve safety limits
    uint256 public constant MAX_TOTAL_SUPPLY = 1e12 * 1e18; // 1 trillion tokens
    uint256 public constant MIN_BASE_PRICE = 1;             // 0.000001 USDC
    uint256 public constant MAX_BASE_PRICE = 1e8 * 1e6;     // 100M USDC per token
    uint256 public constant MAX_SLOPE = 1e20;               // Prevent extreme slopes

    // Staking rewards
    uint256 public constant REWARD_DURATION = 365 days;     // 1 year payout period

    // ========== EVENTS ==========
    event TokensBought(
        address indexed buyer,
        uint256 usdcAmount,
        uint256 tokensOut,
        uint256 platformFee,
        uint256 newPrice,
        uint256 timestamp
    );

    event TokensSold(
        address indexed seller,
        uint256 tokenAmount,
        uint256 usdcOut,
        uint256 platformFee,
        uint256 newPrice,
        uint256 timestamp
    );

    event TokenGraduated(
        uint256 creatorReserve,
        uint256 stakingRewardPool,
        uint256 platformFee,
        uint256 finalSupply,
        uint256 timestamp
    );

    event StakingStarted(
        address indexed user,
        uint256 tokenAmount,
        uint256 timestamp
    );

    event StakingRewardsClaimed(
        address indexed user,
        uint256 rewardAmount,
        uint256 tokensStaked,
        uint256 timestamp
    );

    event CreatorReserveWithdrawn(
        address indexed creator,
        uint256 usdcAmount,
        string reason,
        uint256 timestamp
    );

    // ========== CUSTOM ERRORS ==========
    error InvalidAmount();
    error InsufficientBalance();
    error SlippageTooHigh();
    error AlreadyGraduated();
    error NotGraduated();
    error InvalidCurveType();
    error ZeroAddress();
    error InvalidParameter(string param);
    error NoRewardsClaimable();
    error RewardsPoolExhausted();
    error NotCreator();

    // ========== MODIFIERS ==========
    modifier notGraduated() {
        if (isGraduated) revert AlreadyGraduated();
        _;
    }

    modifier onlyGraduated() {
        if (!isGraduated) revert NotGraduated();
        _;
    }

    modifier onlyCreator() {
        if (msg.sender != tokenCreator) revert NotCreator();
        _;
    }

    // ========== CONSTRUCTOR ==========
    /**
     * @dev Initialize bonding curve AMM for a token
     * @param _token ERC20 token created by factory (18 decimals)
     * @param _tokenCreator Creator of token (receives graduation funds)
     * @param _basePrice Starting price in USDC (6 decimals, e.g., 1e4 = $0.01)
     * @param _slope Price increase per token (scale relative to PRECISION)
     * @param _curveType 0 = linear, 1 = exponential
     * @param _graduationThreshold Supply at which token graduates (18 decimals)
     * @param _feeVault ARC platform fee recipient
     * @param _usdc USDC token address
     */
    constructor(
        address _token,
        address _tokenCreator,
        uint256 _basePrice,
        uint256 _slope,
        uint8 _curveType,
        uint256 _graduationThreshold,
        address _feeVault,
        address _usdc
    ) Ownable(msg.sender) {
        if (_token == address(0)) revert ZeroAddress();
        if (_tokenCreator == address(0)) revert ZeroAddress();
        if (_feeVault == address(0)) revert ZeroAddress();
        if (_usdc == address(0)) revert ZeroAddress();
        if (_curveType > 1) revert InvalidCurveType();

        if (_basePrice < MIN_BASE_PRICE || _basePrice > MAX_BASE_PRICE) {
            revert InvalidParameter("basePrice");
        }
        if (_slope > MAX_SLOPE) {
            revert InvalidParameter("slope");
        }
        if (_graduationThreshold == 0 || _graduationThreshold > MAX_TOTAL_SUPPLY) {
            revert InvalidParameter("graduationThreshold");
        }

        token = IERC20(_token);
        usdc = IERC20(_usdc);
        tokenCreator = _tokenCreator;
        feeVault = _feeVault;
        basePrice = _basePrice;
        slope = _slope;
        curveType = _curveType;
        graduationThreshold = _graduationThreshold;
    }

    // ========== BUY FUNCTION ==========
    /**
     * @dev Buy tokens with USDC
     * @param usdcAmount Amount of USDC to spend (6 decimals)
     * @param minTokensOut Minimum tokens to receive (slippage protection)
     *
     * FLOW:
     * 1. User approves USDC spending on this contract
     * 2. Contract transfers USDC from user
     * 3. Platform fee deducted
     * 4. Remaining USDC used to calculate tokens via bonding curve
     * 5. Tokens transferred to buyer
     * 6. Check if graduation threshold reached
     */
    function buyTokens(uint256 usdcAmount, uint256 minTokensOut)
        external
        nonReentrant
        whenNotPaused
        notGraduated
    {
        if (usdcAmount == 0) revert InvalidAmount();

        uint256 platformFee = (usdcAmount * PLATFORM_FEE_BPS) / 10000;
        uint256 usdcAfterFee = usdcAmount - platformFee;

        // Calculate tokens from bonding curve
        uint256 tokensOut = calculateTokensOut(usdcAfterFee, currentSupply);

        if (tokensOut == 0) revert InvalidAmount();
        if (tokensOut < minTokensOut) revert SlippageTooHigh();
        if (tokensOut > token.balanceOf(address(this))) revert InsufficientBalance();

        // Effects
        uint256 newSupply = currentSupply + tokensOut;
        bool willGraduate = newSupply >= graduationThreshold;
        currentSupply = newSupply;
        totalVolume += usdcAmount;

        // Interactions
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        token.safeTransfer(msg.sender, tokensOut);
        usdc.safeTransfer(feeVault, platformFee);

        // Graduate if threshold reached
        if (willGraduate && !isGraduated) {
            _graduateToken();
        }

        emit TokensBought(
            msg.sender,
            usdcAmount,
            tokensOut,
            platformFee,
            getCurrentPrice(),
            block.timestamp
        );
    }

    // ========== SELL FUNCTION ==========
    /**
     * @dev Sell tokens for USDC
     * @param tokenAmount Tokens to sell (18 decimals)
     * @param minUsdcOut Minimum USDC to receive (slippage protection)
     */
    function sellTokens(uint256 tokenAmount, uint256 minUsdcOut)
        external
        nonReentrant
        whenNotPaused
        notGraduated
    {
        if (tokenAmount == 0) revert InvalidAmount();
        if (tokenAmount > currentSupply) revert InvalidAmount();

        uint256 usdcValue = calculateUsdcOut(tokenAmount, currentSupply);
        uint256 platformFee = (usdcValue * PLATFORM_FEE_BPS) / 10000;
        uint256 usdcAfterFee = usdcValue - platformFee;

        if (usdcAfterFee < minUsdcOut) revert SlippageTooHigh();
        if (usdcValue > usdc.balanceOf(address(this))) revert InsufficientBalance();

        // Effects
        currentSupply -= tokenAmount;
        totalVolume += usdcValue;

        // Interactions (CEI: token in first, USDC out second)
        token.safeTransferFrom(msg.sender, address(this), tokenAmount);
        usdc.safeTransfer(msg.sender, usdcAfterFee);
        usdc.safeTransfer(feeVault, platformFee);

        emit TokensSold(
            msg.sender,
            tokenAmount,
            usdcAfterFee,
            platformFee,
            getCurrentPrice(),
            block.timestamp
        );
    }

    // ========== BONDING CURVE MATH ==========

    /**
     * @dev Calculate how many tokens you get for a given USDC amount
     * Uses the cumulative cost function to find the token amount
     * that matches the USDC input at the current supply level.
     *
     * For LINEAR: cost(S_start → S_end) = basePrice * (S_end - S_start) / PRECISION
     *             + slope * (S_end² - S_start²) / (2 * PRECISION²)
     *
     * We use binary search to find the token amount since inverting
     * the quadratic analytically risks precision loss at 6-decimal scale.
     *
     * @param usdcAmount USDC to spend (6 decimals)
     * @param fromSupply Current supply level (18 decimals)
     * @return tokensOut Tokens to receive (18 decimals)
     */
    function calculateTokensOut(uint256 usdcAmount, uint256 fromSupply)
        public
        view
        returns (uint256 tokensOut)
    {
        if (usdcAmount == 0) return 0;

        // Binary search for token amount
        uint256 low = 0;
        uint256 high = token.balanceOf(address(this));

        // Cap high at remaining before graduation
        if (fromSupply + high > graduationThreshold) {
            high = graduationThreshold - fromSupply;
        }

        // 64 iterations covers >1e18 range with precision
        for (uint256 i = 0; i < 64; i++) {
            if (low >= high) break;

            uint256 mid = (low + high + 1) / 2;
            uint256 cost = _cumulativeCost(fromSupply, fromSupply + mid);

            if (cost <= usdcAmount) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }

        return low;
    }

    /**
     * @dev Calculate USDC received for selling a given token amount
     * @param tokenAmount Tokens to sell (18 decimals)
     * @param fromSupply Current supply level (18 decimals)
     * @return usdcOut USDC to receive (6 decimals)
     */
    function calculateUsdcOut(uint256 tokenAmount, uint256 fromSupply)
        public
        view
        returns (uint256 usdcOut)
    {
        if (tokenAmount == 0 || fromSupply == 0) return 0;
        if (tokenAmount > fromSupply) revert InvalidAmount();

        return _cumulativeCost(fromSupply - tokenAmount, fromSupply);
    }

    /**
     * @dev Calculate cumulative cost of tokens between two supply points
     * @param supplyStart Lower supply bound (18 decimals)
     * @param supplyEnd Upper supply bound (18 decimals)
     * @return cost Cost in USDC (6 decimals)
     */
    function _cumulativeCost(uint256 supplyStart, uint256 supplyEnd)
        internal
        view
        returns (uint256 cost)
    {
        if (supplyEnd <= supplyStart) return 0;

        if (curveType == 0) {
            return _linearCumulativeCost(supplyStart, supplyEnd);
        } else {
            return _exponentialCumulativeCost(supplyStart, supplyEnd);
        }
    }

    /**
     * @dev LINEAR bonding curve cumulative cost
     * price(S) = basePrice + slope * S / PRECISION
     * cost(S_start → S_end) = basePrice * (S_end - S_start) / PRECISION
     *                        + slope * (S_end² - S_start²) / (2 * PRECISION²)
     *
     * Uses Math.mulDiv for precision-safe multiplication to prevent
     * overflow/truncation with 6-decimal USDC outputs.
     */
    function _linearCumulativeCost(uint256 supplyStart, uint256 supplyEnd)
        internal
        view
        returns (uint256)
    {
        uint256 amount = supplyEnd - supplyStart;

        // Base component: basePrice * amount / PRECISION
        uint256 baseComponent = Math.mulDiv(basePrice, amount, PRECISION);

        // Slope component: slope * (S_end² - S_start²) / (2 * PRECISION²)
        // = slope * (S_end + S_start) * (S_end - S_start) / (2 * PRECISION²)
        // Break into two mulDiv to avoid overflow
        uint256 sumSupply = supplyEnd + supplyStart;
        uint256 slopeComponent = Math.mulDiv(
            slope,
            Math.mulDiv(sumSupply, amount, PRECISION),
            2 * PRECISION
        );

        return baseComponent + slopeComponent;
    }

    /**
     * @dev EXPONENTIAL bonding curve cumulative cost
     * price(S) = basePrice * (1 + slope * S / PRECISION)²
     *
     * Approximated as:
     * cost ≈ basePrice * amount / PRECISION
     *       + 2 * basePrice * slope * (S_end² - S_start²) / (2 * PRECISION³)
     *       + higher order terms (negligible for reasonable slopes)
     *
     * For safety, uses the same linear formula but with doubled slope,
     * giving steeper price increases without complex exponentiation.
     */
    function _exponentialCumulativeCost(uint256 supplyStart, uint256 supplyEnd)
        internal
        view
        returns (uint256)
    {
        uint256 amount = supplyEnd - supplyStart;

        // Base component: basePrice * amount / PRECISION
        uint256 baseComponent = Math.mulDiv(basePrice, amount, PRECISION);

        // Steeper slope component (2x slope for exponential-like behavior)
        uint256 sumSupply = supplyEnd + supplyStart;
        uint256 slopeComponent = Math.mulDiv(
            slope * 2,
            Math.mulDiv(sumSupply, amount, PRECISION),
            2 * PRECISION
        );

        // Additional quadratic term for more aggressive curve
        uint256 cubicComponent = Math.mulDiv(
            slope,
            Math.mulDiv(
                Math.mulDiv(supplyEnd, supplyEnd, PRECISION),
                amount,
                PRECISION
            ),
            3 * PRECISION
        );

        return baseComponent + slopeComponent + cubicComponent;
    }

    /**
     * @dev Get current spot price at current supply level
     * @return Current price in USDC (6 decimals)
     */
    function getCurrentPrice() public view returns (uint256) {
        return _priceAt(currentSupply);
    }

    /**
     * @dev Price at a given supply level
     * LINEAR: price = basePrice + slope * supply / PRECISION
     * EXPONENTIAL: price = basePrice + 2 * slope * supply / PRECISION
     */
    function _priceAt(uint256 supply) internal view returns (uint256) {
        if (curveType == 0) {
            // LINEAR
            return basePrice + Math.mulDiv(slope, supply, PRECISION);
        } else {
            // EXPONENTIAL (steeper)
            return basePrice + Math.mulDiv(slope * 2, supply, PRECISION);
        }
    }

    // ========== GRADUATION LOGIC ==========

    /**
     * @dev Internal: Graduate token, split reserves
     * SPLIT:
     * - 50% to creator (can withdraw anytime)
     * - 25% to staking rewards (time-weighted, 365 days)
     * - 25% to platform (transferred immediately to feeVault)
     */
    function _graduateToken() internal {
        uint256 totalUSDC = usdc.balanceOf(address(this));
        require(totalUSDC > 0, "No USDC reserves");

        uint256 creatorReserve = (totalUSDC * 50) / 100;
        uint256 stakingRewardPool = (totalUSDC * 25) / 100;
        uint256 platformFee = totalUSDC - creatorReserve - stakingRewardPool; // remainder avoids dust

        reserves = GraduationReserves({
            creatorReserve: creatorReserve,
            stakingRewardPool: stakingRewardPool,
            platformFee: platformFee,
            graduatedAt: block.timestamp
        });

        isGraduated = true;

        // Transfer platform fee immediately to FeeVault
        usdc.safeTransfer(feeVault, platformFee);

        emit TokenGraduated(
            creatorReserve,
            stakingRewardPool,
            platformFee,
            currentSupply,
            block.timestamp
        );
    }

    // ========== POST-GRADUATION: CREATOR TREASURY ==========

    /**
     * @dev Creator withdraws from their 50% reserve
     * @param usdcAmount Amount to withdraw
     * @param reason Human-readable reason for transparency
     */
    function withdrawCreatorReserve(uint256 usdcAmount, string calldata reason)
        external
        nonReentrant
        onlyCreator
        onlyGraduated
    {
        if (usdcAmount == 0) revert InvalidAmount();
        if (usdcAmount > reserves.creatorReserve) revert InsufficientBalance();

        reserves.creatorReserve -= usdcAmount;
        usdc.safeTransfer(tokenCreator, usdcAmount);

        emit CreatorReserveWithdrawn(tokenCreator, usdcAmount, reason, block.timestamp);
    }

    // ========== POST-GRADUATION: STAKING REWARDS ==========

    /**
     * @dev Stake tokens to earn USDC rewards from the 25% pool
     * Rewards are distributed proportionally over 365 days.
     * @param tokenAmount Token amount to stake (18 decimals)
     */
    function stakeTokens(uint256 tokenAmount)
        external
        nonReentrant
        onlyGraduated
    {
        if (tokenAmount == 0) revert InvalidAmount();

        // Claim any pending rewards before updating stake
        if (tokenStaked[msg.sender] > 0) {
            _claimRewardsInternal();
        }

        token.safeTransferFrom(msg.sender, address(this), tokenAmount);

        tokenStaked[msg.sender] += tokenAmount;
        totalTokenStaked += tokenAmount;
        stakingStartTime[msg.sender] = block.timestamp;

        emit StakingStarted(msg.sender, tokenAmount, block.timestamp);
    }

    /**
     * @dev Claim accrued USDC staking rewards
     * Formula: (userStake / totalStaked) * stakingRewardPool * elapsed / REWARD_DURATION
     */
    function claimStakingRewards()
        external
        nonReentrant
        onlyGraduated
    {
        _claimRewardsInternal();
    }

    function _claimRewardsInternal() internal {
        uint256 reward = _calculateReward(msg.sender);
        if (reward == 0) revert NoRewardsClaimable();

        uint256 availablePool = reserves.stakingRewardPool - totalRewardsClaimed;
        if (reward > availablePool) {
            reward = availablePool; // Cap at remaining pool
        }
        if (reward == 0) revert RewardsPoolExhausted();

        rewardsClaimed[msg.sender] += reward;
        totalRewardsClaimed += reward;
        stakingStartTime[msg.sender] = block.timestamp; // Reset timer

        usdc.safeTransfer(msg.sender, reward);

        emit StakingRewardsClaimed(
            msg.sender,
            reward,
            tokenStaked[msg.sender],
            block.timestamp
        );
    }

    /**
     * @dev Calculate pending reward for a staker
     * @param user Staker address
     * @return Claimable USDC amount (6 decimals)
     */
    function _calculateReward(address user) internal view returns (uint256) {
        if (totalTokenStaked == 0 || tokenStaked[user] == 0) return 0;
        if (reserves.graduatedAt == 0) return 0;

        uint256 elapsed = block.timestamp - stakingStartTime[user];
        if (elapsed == 0) return 0;

        // Cap at reward duration
        if (elapsed > REWARD_DURATION) elapsed = REWARD_DURATION;

        uint256 totalPool = reserves.stakingRewardPool;

        // proportionalShare = (userStake / totalStaked) * totalPool
        uint256 proportionalShare = Math.mulDiv(
            tokenStaked[user],
            totalPool,
            totalTokenStaked
        );

        // Time-weighted reward = proportionalShare * elapsed / REWARD_DURATION
        uint256 reward = Math.mulDiv(proportionalShare, elapsed, REWARD_DURATION);

        // Subtract already claimed
        if (reward <= rewardsClaimed[user]) return 0;

        return reward - rewardsClaimed[user];
    }

    /**
     * @dev Unstake tokens (stops earning rewards)
     * @param tokenAmount Tokens to unstake
     */
    function unstakeTokens(uint256 tokenAmount)
        external
        nonReentrant
        onlyGraduated
    {
        if (tokenAmount == 0) revert InvalidAmount();
        if (tokenAmount > tokenStaked[msg.sender]) revert InsufficientBalance();

        // Claim pending rewards first
        uint256 reward = _calculateReward(msg.sender);
        if (reward > 0) {
            uint256 availablePool = reserves.stakingRewardPool - totalRewardsClaimed;
            if (reward > availablePool) reward = availablePool;
            if (reward > 0) {
                rewardsClaimed[msg.sender] += reward;
                totalRewardsClaimed += reward;
                usdc.safeTransfer(msg.sender, reward);

                emit StakingRewardsClaimed(
                    msg.sender,
                    reward,
                    tokenStaked[msg.sender],
                    block.timestamp
                );
            }
        }

        tokenStaked[msg.sender] -= tokenAmount;
        totalTokenStaked -= tokenAmount;

        token.safeTransfer(msg.sender, tokenAmount);
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Calculate expected tokens out for a USDC buy
     */
    function calculateBuyReturn(uint256 usdcAmount)
        external
        view
        returns (uint256 tokensOut, uint256 fee)
    {
        fee = (usdcAmount * PLATFORM_FEE_BPS) / 10000;
        tokensOut = calculateTokensOut(usdcAmount - fee, currentSupply);
    }

    /**
     * @dev Calculate expected USDC out for a token sell
     */
    function calculateSellReturn(uint256 tokenAmount)
        external
        view
        returns (uint256 usdcOut, uint256 fee)
    {
        uint256 gross = calculateUsdcOut(tokenAmount, currentSupply);
        fee = (gross * PLATFORM_FEE_BPS) / 10000;
        usdcOut = gross - fee;
    }

    /**
     * @dev Get the USDC reserve balance held by this AMM
     */
    function getReserveBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @dev Get remaining token balance available for purchase
     */
    function getAvailableTokens() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @dev Get graduation progress as basis points (0-10000)
     */
    function getGraduationProgress() external view returns (uint256) {
        if (graduationThreshold == 0) return 10000;
        if (currentSupply >= graduationThreshold) return 10000;
        return (currentSupply * 10000) / graduationThreshold;
    }

    /**
     * @dev Get pending staking rewards for a user
     */
    function getClaimableRewards(address user) external view returns (uint256) {
        return _calculateReward(user);
    }

    /**
     * @dev Get remaining staking reward pool
     */
    function getStakingPoolRemaining() external view returns (uint256) {
        if (!isGraduated) return 0;
        return reserves.stakingRewardPool - totalRewardsClaimed;
    }

    /**
     * @dev Get creator's remaining reserve
     */
    function getCreatorReserveBalance() external view returns (uint256) {
        return reserves.creatorReserve;
    }

    // ========== ADMIN ==========

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
