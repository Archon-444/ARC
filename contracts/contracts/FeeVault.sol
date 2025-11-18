// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FeeVault
 * @notice Central fee and royalty distributor for each sale
 * @dev Handles collection-specific and global revenue splits
 */
contract FeeVault is Ownable {
    IERC20 public immutable USDC;
    address public marketplace;

    struct GlobalSplit {
        address recipient;
        uint16 bps;
    }

    struct CollectionSplit {
        address recipient;
        uint16 bps;
    }

    // collection => CollectionSplit[]
    mapping(address => CollectionSplit[]) private _collectionSplits;

    // Global splits for platform/team
    GlobalSplit[] private _globalSplits;

    // Custom Errors
    error NotOwner();
    error NotMarketplace();
    error InvalidSplits();

    // Events
    event MarketplaceSet(address indexed marketplace);
    event GlobalSplitsUpdated(GlobalSplit[] splits);
    event CollectionSplitsUpdated(address indexed collection);
    event Distributed(
        address indexed collection,
        uint256 indexed tokenId,
        uint256 amount
    );

    constructor(address _usdc, address _marketplace) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        marketplace = _marketplace;
    }

    // ==================== Admin Functions ====================

    /**
     * @notice Set marketplace contract address
     * @param _marketplace New marketplace address
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
        emit MarketplaceSet(_marketplace);
    }

    /**
     * @notice Set global splits for platform/team
     * @param splits Array of GlobalSplit structs
     */
    function setGlobalSplits(GlobalSplit[] calldata splits) external onlyOwner {
        // Validate total bps
        uint16 totalBps = 0;
        for (uint256 i = 0; i < splits.length; i++) {
            totalBps += splits[i].bps;
        }
        if (totalBps > 10_000) revert InvalidSplits();

        // Clear existing splits
        delete _globalSplits;

        // Set new splits
        for (uint256 i = 0; i < splits.length; i++) {
            _globalSplits.push(splits[i]);
        }

        emit GlobalSplitsUpdated(splits);
    }

    /**
     * @notice Set collection-specific royalty splits
     * @param collection Collection address
     * @param splits Array of CollectionSplit structs
     */
    function setCollectionSplits(
        address collection,
        CollectionSplit[] calldata splits
    ) external onlyOwner {
        // Validate total bps
        uint16 totalBps = 0;
        for (uint256 i = 0; i < splits.length; i++) {
            totalBps += splits[i].bps;
        }
        if (totalBps > 10_000) revert InvalidSplits();

        // Clear existing splits
        delete _collectionSplits[collection];

        // Set new splits
        for (uint256 i = 0; i < splits.length; i++) {
            _collectionSplits[collection].push(splits[i]);
        }

        emit CollectionSplitsUpdated(collection);
    }

    // ==================== Distribution Function ====================

    /**
     * @notice Distribute sale proceeds to collection creators and global recipients
     * @param collection NFT collection address
     * @param tokenId Token ID (for future per-token overrides)
     * @param amount Amount in USDC to distribute
     */
    function distribute(
        address collection,
        uint256 tokenId,
        uint256 amount
    ) external {
        if (msg.sender != marketplace) revert NotMarketplace();

        // First transfer USDC from marketplace to vault
        USDC.transferFrom(msg.sender, address(this), amount);

        uint256 remaining = amount;

        // 1. Distribute collection splits (creator royalties)
        CollectionSplit[] storage collectionSplits = _collectionSplits[collection];
        for (uint256 i = 0; i < collectionSplits.length; i++) {
            uint256 splitAmount = (amount * collectionSplits[i].bps) / 10_000;
            if (splitAmount > 0) {
                USDC.transfer(collectionSplits[i].recipient, splitAmount);
                remaining -= splitAmount;
            }
        }

        // 2. Distribute global splits (platform/team)
        for (uint256 i = 0; i < _globalSplits.length; i++) {
            uint256 splitAmount = (amount * _globalSplits[i].bps) / 10_000;
            if (splitAmount > 0) {
                USDC.transfer(_globalSplits[i].recipient, splitAmount);
                remaining -= splitAmount;
            }
        }

        // 3. Send remaining to collection owner/seller
        // Note: In v0.1, the marketplace handles seller payment directly,
        // so this vault primarily handles royalties and platform fees.
        // If there's remaining due to rounding, it stays in vault or
        // we could send to a designated address.

        emit Distributed(collection, tokenId, amount);
    }

    // ==================== View Functions ====================

    /**
     * @notice Get collection splits
     * @param collection Collection address
     * @return Array of CollectionSplit structs
     */
    function getCollectionSplits(address collection)
        external
        view
        returns (CollectionSplit[] memory)
    {
        return _collectionSplits[collection];
    }

    /**
     * @notice Get global splits
     * @return Array of GlobalSplit structs
     */
    function getGlobalSplits() external view returns (GlobalSplit[] memory) {
        return _globalSplits;
    }

    /**
     * @notice Get number of collection splits for a collection
     * @param collection Collection address
     * @return Number of splits
     */
    function getCollectionSplitsCount(address collection) external view returns (uint256) {
        return _collectionSplits[collection].length;
    }

    /**
     * @notice Get number of global splits
     * @return Number of global splits
     */
    function getGlobalSplitsCount() external view returns (uint256) {
        return _globalSplits.length;
    }

    /**
     * @notice Emergency withdraw (owner only)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        USDC.transfer(owner(), amount);
    }
}
