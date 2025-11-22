// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library LibMarketplace {
    bytes32 constant MARKETPLACE_STORAGE_POSITION = keccak256("arc.marketplace.storage");

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    struct MarketplaceStorage {
        // Configuration
        IERC20 usdc;
        address feeRecipient;
        uint256 platformFee; // Basis points (e.g., 250 = 2.5%)
        address stakingContract;
        
        // State
        mapping(uint256 => Listing) listings;
        uint256 listingIdCounter;
        
        mapping(uint256 => Auction) auctions;
        uint256 auctionIdCounter;
        
        mapping(address => uint256) earnings;
        
        // Reentrancy Guard
        uint256 _status;
    }

    function marketplaceStorage() internal pure returns (MarketplaceStorage storage ms) {
        bytes32 position = MARKETPLACE_STORAGE_POSITION;
        assembly {
            ms.slot := position
        }
    }

    // Events
    event ListingCreated(uint256 indexed listingId, address indexed seller, address nftContract, uint256 tokenId, uint256 price);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, address nftContract, uint256 tokenId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount);
    
    event PlatformFeeUpdated(uint256 newFee);
}
