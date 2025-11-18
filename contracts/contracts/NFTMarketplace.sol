// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IFeeVault {
    function distribute(
        address collection,
        uint256 tokenId,
        uint256 amount
    ) external;
}

/**
 * @title NFTMarketplace
 * @notice Handle listings, purchases, and auctions with USDC payments
 * @dev Integrates with FeeVault for fee/royalty distribution
 */
contract NFTMarketplace is ReentrancyGuard, Ownable {
    IERC20 public immutable USDC;
    address public feeVault;
    uint16 public protocolFeeBps; // e.g. 250 = 2.5%

    struct Listing {
        address seller;
        address collection;
        uint256 tokenId;
        uint256 price; // in USDC (6 decimals)
        bool active;
    }

    struct Auction {
        address seller;
        address collection;
        uint256 tokenId;
        uint256 reservePrice;
        uint64 startTime;
        uint64 endTime;
        address highestBidder;
        uint256 highestBid;
        bool settled;
    }

    // collection => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    // collection => tokenId => Auction
    mapping(address => mapping(uint256 => Auction)) public auctions;

    // Optional: per-collection flags for which collections are allowed
    mapping(address => bool) public allowedCollections;

    // Custom Errors
    error NotOwner();
    error NotSeller();
    error InvalidPrice();
    error ListingNotActive();
    error AuctionNotActive();
    error AuctionNotStarted();
    error AuctionEnded();
    error BidTooLow();
    error InvalidTimeRange();
    error CollectionNotAllowed();

    // Events
    event ListingCreated(
        address indexed seller,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 price
    );

    event ListingUpdated(
        address indexed seller,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 newPrice
    );

    event ListingCancelled(
        address indexed seller,
        address indexed collection,
        uint256 indexed tokenId
    );

    event Purchased(
        address indexed buyer,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 price
    );

    event AuctionCreated(
        address indexed seller,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 reservePrice,
        uint64 startTime,
        uint64 endTime
    );

    event BidPlaced(
        address indexed bidder,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 amount
    );

    event AuctionSettled(
        address indexed winner,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 amount
    );

    event ProtocolFeeUpdated(uint16 oldFeeBps, uint16 newFeeBps);
    event FeeVaultUpdated(address oldFeeVault, address newFeeVault);
    event CollectionAllowed(address indexed collection, bool allowed);

    constructor(
        address _usdc,
        address _feeVault,
        uint16 _protocolFeeBps
    ) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        feeVault = _feeVault;
        protocolFeeBps = _protocolFeeBps;
    }

    // ==================== Admin Functions ====================

    /**
     * @notice Update protocol fee in basis points
     * @param newFeeBps New fee (e.g., 250 = 2.5%)
     */
    function setProtocolFeeBps(uint16 newFeeBps) external onlyOwner {
        uint16 oldFeeBps = protocolFeeBps;
        protocolFeeBps = newFeeBps;
        emit ProtocolFeeUpdated(oldFeeBps, newFeeBps);
    }

    /**
     * @notice Update fee vault address
     * @param newFeeVault New FeeVault contract address
     */
    function setFeeVault(address newFeeVault) external onlyOwner {
        address oldFeeVault = feeVault;
        feeVault = newFeeVault;
        emit FeeVaultUpdated(oldFeeVault, newFeeVault);
    }

    /**
     * @notice Allow or disallow a collection
     * @param collection Collection address
     * @param allowed Whether collection is allowed
     */
    function setCollectionAllowed(address collection, bool allowed) external onlyOwner {
        allowedCollections[collection] = allowed;
        emit CollectionAllowed(collection, allowed);
    }

    // ==================== Listing Functions ====================

    /**
     * @notice Create a fixed-price listing
     * @param collection NFT collection address
     * @param tokenId Token ID
     * @param price Price in USDC (6 decimals)
     */
    function listItem(
        address collection,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        if (price == 0) revert InvalidPrice();
        // Note: Set allowedCollections for specific collection if needed
        // if (!allowedCollections[collection]) revert CollectionNotAllowed();

        IERC721 nft = IERC721(collection);

        // Transfer NFT from seller to marketplace
        nft.transferFrom(msg.sender, address(this), tokenId);

        listings[collection][tokenId] = Listing({
            seller: msg.sender,
            collection: collection,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit ListingCreated(msg.sender, collection, tokenId, price);
    }

    /**
     * @notice Update listing price
     * @param collection NFT collection address
     * @param tokenId Token ID
     * @param newPrice New price in USDC
     */
    function updateListingPrice(
        address collection,
        uint256 tokenId,
        uint256 newPrice
    ) external {
        Listing storage listing = listings[collection][tokenId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();
        if (newPrice == 0) revert InvalidPrice();

        listing.price = newPrice;
        emit ListingUpdated(msg.sender, collection, tokenId, newPrice);
    }

    /**
     * @notice Cancel a listing
     * @param collection NFT collection address
     * @param tokenId Token ID
     */
    function cancelListing(address collection, uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[collection][tokenId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();

        listing.active = false;

        // Return NFT to seller
        IERC721(collection).transferFrom(address(this), msg.sender, tokenId);

        emit ListingCancelled(msg.sender, collection, tokenId);
    }

    /**
     * @notice Buy a listed NFT
     * @param collection NFT collection address
     * @param tokenId Token ID
     */
    function buyItem(address collection, uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[collection][tokenId];
        if (!listing.active) revert ListingNotActive();

        uint256 price = listing.price;
        address seller = listing.seller;

        // Mark listing inactive
        listing.active = false;

        // Calculate fees
        uint256 protocolFee = (price * protocolFeeBps) / 10_000;
        uint256 amountToSplit = price - protocolFee;

        // Transfer USDC from buyer to marketplace
        USDC.transferFrom(msg.sender, address(this), price);

        // Send protocol fee to owner
        if (protocolFee > 0) {
            USDC.transfer(owner(), protocolFee);
        }

        // Approve and distribute via FeeVault
        if (amountToSplit > 0) {
            USDC.approve(feeVault, amountToSplit);
            IFeeVault(feeVault).distribute(collection, tokenId, amountToSplit);
        }

        // Transfer NFT to buyer
        IERC721(collection).transferFrom(address(this), msg.sender, tokenId);

        emit Purchased(msg.sender, collection, tokenId, price);
    }

    // ==================== Auction Functions ====================

    /**
     * @notice Create an auction
     * @param collection NFT collection address
     * @param tokenId Token ID
     * @param reservePrice Minimum price in USDC
     * @param startTime Auction start timestamp
     * @param endTime Auction end timestamp
     */
    function createAuction(
        address collection,
        uint256 tokenId,
        uint256 reservePrice,
        uint64 startTime,
        uint64 endTime
    ) external nonReentrant {
        if (reservePrice == 0) revert InvalidPrice();
        if (startTime >= endTime) revert InvalidTimeRange();
        if (startTime < block.timestamp) revert InvalidTimeRange();

        IERC721 nft = IERC721(collection);

        // Transfer NFT from seller to marketplace
        nft.transferFrom(msg.sender, address(this), tokenId);

        auctions[collection][tokenId] = Auction({
            seller: msg.sender,
            collection: collection,
            tokenId: tokenId,
            reservePrice: reservePrice,
            startTime: startTime,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            settled: false
        });

        emit AuctionCreated(msg.sender, collection, tokenId, reservePrice, startTime, endTime);
    }

    /**
     * @notice Place a bid on an auction
     * @param collection NFT collection address
     * @param tokenId Token ID
     * @param bidAmount Bid amount in USDC
     */
    function placeBid(
        address collection,
        uint256 tokenId,
        uint256 bidAmount
    ) external nonReentrant {
        Auction storage auction = auctions[collection][tokenId];
        if (auction.settled) revert AuctionNotActive();
        if (block.timestamp < auction.startTime) revert AuctionNotStarted();
        if (block.timestamp >= auction.endTime) revert AuctionEnded();
        if (bidAmount < auction.reservePrice) revert BidTooLow();
        if (bidAmount <= auction.highestBid) revert BidTooLow();

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            USDC.transfer(auction.highestBidder, auction.highestBid);
        }

        // Transfer bid from new bidder
        USDC.transferFrom(msg.sender, address(this), bidAmount);

        auction.highestBidder = msg.sender;
        auction.highestBid = bidAmount;

        emit BidPlaced(msg.sender, collection, tokenId, bidAmount);
    }

    /**
     * @notice Settle an auction after it ends
     * @param collection NFT collection address
     * @param tokenId Token ID
     */
    function settleAuction(address collection, uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[collection][tokenId];
        if (auction.settled) revert AuctionNotActive();
        if (block.timestamp < auction.endTime) revert AuctionNotStarted();

        auction.settled = true;

        if (auction.highestBid >= auction.reservePrice && auction.highestBidder != address(0)) {
            // Successful auction
            uint256 price = auction.highestBid;

            // Calculate fees
            uint256 protocolFee = (price * protocolFeeBps) / 10_000;
            uint256 amountToSplit = price - protocolFee;

            // Send protocol fee to owner
            if (protocolFee > 0) {
                USDC.transfer(owner(), protocolFee);
            }

            // Approve and distribute via FeeVault
            if (amountToSplit > 0) {
                USDC.approve(feeVault, amountToSplit);
                IFeeVault(feeVault).distribute(collection, tokenId, amountToSplit);
            }

            // Transfer NFT to winner
            IERC721(collection).transferFrom(address(this), auction.highestBidder, tokenId);

            emit AuctionSettled(auction.highestBidder, collection, tokenId, price);
        } else {
            // No valid bids - return NFT to seller
            IERC721(collection).transferFrom(address(this), auction.seller, tokenId);

            // Refund highest bidder if any
            if (auction.highestBidder != address(0)) {
                USDC.transfer(auction.highestBidder, auction.highestBid);
            }

            emit AuctionSettled(address(0), collection, tokenId, 0);
        }
    }
}
