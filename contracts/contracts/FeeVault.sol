// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FeeVault
 * @dev Central fee and royalty distributor for marketplace sales
 * Handles automatic splitting of sale proceeds to sellers, creators, and platform
 */
contract FeeVault is ReentrancyGuard, Ownable {
    IERC20 public immutable usdc;
    address public marketplace;

    struct Split {
        address recipient;
        uint16 bps; // Basis points (10000 = 100%)
    }

    // Global platform fee recipients (platform treasury, team, etc.)
    Split[] public globalSplits;

    // Collection-specific royalty splits
    mapping(address => Split[]) public collectionSplits;

    // Events
    event MarketplaceSet(address indexed marketplace);
    event GlobalSplitsUpdated(Split[] splits);
    event CollectionSplitsUpdated(address indexed collection, Split[] splits);
    event Distributed(
        address indexed collection,
        uint256 indexed tokenId,
        uint256 totalAmount,
        uint256 sellerAmount,
        uint256 creatorAmount,
        uint256 platformAmount
    );

    // Errors
    error NotMarketplace();
    error InvalidSplits();
    error InvalidBasisPoints();
    error TransferFailed();

    constructor(address _usdc, address _marketplace) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_marketplace != address(0), "Invalid marketplace address");
        usdc = IERC20(_usdc);
        marketplace = _marketplace;
    }

    /**
     * @dev Set marketplace contract address (only owner)
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        require(_marketplace != address(0), "Invalid marketplace");
        marketplace = _marketplace;
        emit MarketplaceSet(_marketplace);
    }

    /**
     * @dev Set global platform fee splits (only owner)
     * @param splits Array of recipients and their basis points
     */
    function setGlobalSplits(Split[] calldata splits) external onlyOwner {
        uint16 totalBps = 0;
        for (uint256 i = 0; i < splits.length; i++) {
            require(splits[i].recipient != address(0), "Invalid recipient");
            totalBps += splits[i].bps;
        }

        // Total should be reasonable (0-5000 bps = 0-50%)
        if (totalBps > 5000) revert InvalidBasisPoints();

        // Clear existing splits
        delete globalSplits;

        // Add new splits
        for (uint256 i = 0; i < splits.length; i++) {
            globalSplits.push(splits[i]);
        }

        emit GlobalSplitsUpdated(splits);
    }

    /**
     * @dev Set collection-specific royalty splits
     * @param collection NFT collection address
     * @param splits Array of creator recipients and their basis points
     */
    function setCollectionSplits(
        address collection,
        Split[] calldata splits
    ) external {
        // Only collection owner or this contract owner can set splits
        require(
            msg.sender == owner() || _isCollectionOwner(collection, msg.sender),
            "Not authorized"
        );

        uint16 totalBps = 0;
        for (uint256 i = 0; i < splits.length; i++) {
            require(splits[i].recipient != address(0), "Invalid recipient");
            totalBps += splits[i].bps;
        }

        // Total creator royalties should not exceed 100%
        if (totalBps > 10000) revert InvalidBasisPoints();

        // Clear existing splits
        delete collectionSplits[collection];

        // Add new splits
        for (uint256 i = 0; i < splits.length; i++) {
            collectionSplits[collection].push(splits[i]);
        }

        emit CollectionSplitsUpdated(collection, splits);
    }

    /**
     * @dev Distribute sale proceeds (only marketplace)
     * @param collection NFT collection address
     * @param tokenId Token ID
     * @param seller Seller address
     * @param totalAmount Total sale amount in USDC
     * @param platformFeeBps Platform fee in basis points
     * @param royaltyBps Royalty fee in basis points
     */
    function distribute(
        address collection,
        uint256 tokenId,
        address seller,
        uint256 totalAmount,
        uint16 platformFeeBps,
        uint16 royaltyBps
    ) external nonReentrant {
        if (msg.sender != marketplace) revert NotMarketplace();

        // Calculate amounts
        uint256 platformAmount = (totalAmount * platformFeeBps) / 10000;
        uint256 royaltyAmount = (totalAmount * royaltyBps) / 10000;
        uint256 sellerAmount = totalAmount - platformAmount - royaltyAmount;

        // Distribute platform fees via global splits
        if (platformAmount > 0) {
            _distributeGlobalSplits(platformAmount);
        }

        // Distribute creator royalties via collection splits
        if (royaltyAmount > 0) {
            _distributeCollectionSplits(collection, royaltyAmount);
        }

        // Send remaining amount to seller
        if (sellerAmount > 0) {
            if (!usdc.transfer(seller, sellerAmount)) revert TransferFailed();
        }

        emit Distributed(
            collection,
            tokenId,
            totalAmount,
            sellerAmount,
            royaltyAmount,
            platformAmount
        );
    }

    /**
     * @dev Distribute amount among global platform fee recipients
     */
    function _distributeGlobalSplits(uint256 amount) internal {
        if (globalSplits.length == 0) {
            // If no splits configured, send to owner
            if (!usdc.transfer(owner(), amount)) revert TransferFailed();
            return;
        }

        uint256 totalBps = 0;
        for (uint256 i = 0; i < globalSplits.length; i++) {
            totalBps += globalSplits[i].bps;
        }

        for (uint256 i = 0; i < globalSplits.length; i++) {
            uint256 splitAmount = (amount * globalSplits[i].bps) / totalBps;
            if (splitAmount > 0) {
                if (!usdc.transfer(globalSplits[i].recipient, splitAmount))
                    revert TransferFailed();
            }
        }
    }

    /**
     * @dev Distribute amount among collection royalty recipients
     */
    function _distributeCollectionSplits(address collection, uint256 amount) internal {
        Split[] storage splits = collectionSplits[collection];

        if (splits.length == 0) {
            // If no splits configured, try to send to collection owner
            address collectionOwner = _getCollectionOwner(collection);
            if (collectionOwner != address(0)) {
                if (!usdc.transfer(collectionOwner, amount)) revert TransferFailed();
            } else {
                // If can't determine owner, send to contract owner
                if (!usdc.transfer(owner(), amount)) revert TransferFailed();
            }
            return;
        }

        uint256 totalBps = 0;
        for (uint256 i = 0; i < splits.length; i++) {
            totalBps += splits[i].bps;
        }

        for (uint256 i = 0; i < splits.length; i++) {
            uint256 splitAmount = (amount * splits[i].bps) / totalBps;
            if (splitAmount > 0) {
                if (!usdc.transfer(splits[i].recipient, splitAmount))
                    revert TransferFailed();
            }
        }
    }

    /**
     * @dev Check if address is collection owner (basic check via Ownable interface)
     */
    function _isCollectionOwner(address collection, address account) internal view returns (bool) {
        try Ownable(collection).owner() returns (address collectionOwner) {
            return collectionOwner == account;
        } catch {
            return false;
        }
    }

    /**
     * @dev Get collection owner
     */
    function _getCollectionOwner(address collection) internal view returns (address) {
        try Ownable(collection).owner() returns (address collectionOwner) {
            return collectionOwner;
        } catch {
            return address(0);
        }
    }

    /**
     * @dev Get global splits
     */
    function getGlobalSplits() external view returns (Split[] memory) {
        return globalSplits;
    }

    /**
     * @dev Get collection splits
     */
    function getCollectionSplits(address collection) external view returns (Split[] memory) {
        return collectionSplits[collection];
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
}
