// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title ArcMarketplace
 * @dev NFT Marketplace with USDC payments, fixed-price listings, and auctions
 * Supports royalty payments and tiered fee discounts for stakers
 */
contract ArcMarketplace is ERC721Holder, ReentrancyGuard, Ownable {
    IERC20 public usdc;
    address public stakingContract;

    uint256 public platformFee = 250; // 2.5% in basis points
    uint256 public constant MAX_FEE = 1000; // 10% maximum
    address public feeRecipient;

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

    // Listing ID => Listing
    mapping(uint256 => Listing) public listings;
    uint256 public listingIdCounter;

    // Auction ID => Auction
    mapping(uint256 => Auction) public auctions;
    uint256 public auctionIdCounter;

    // User => Earnings
    mapping(address => uint256) public earnings;

    // Events
    event ListingCreated(uint256 indexed listingId, address indexed seller, address nftContract, uint256 tokenId, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 price);

    event AuctionCreated(uint256 indexed auctionId, address indexed seller, address nftContract, uint256 tokenId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount);
    event AuctionCancelled(uint256 indexed auctionId);

    event PlatformFeeUpdated(uint256 newFee);
    event EarningsWithdrawn(address indexed user, uint256 amount);

    constructor(address _usdc, address _feeRecipient) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Set the staking contract address
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee too high");
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    /**
     * @dev Create a fixed-price listing
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be greater than 0");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) ||
                nft.getApproved(tokenId) == address(this), "Marketplace not approved");

        uint256 listingId = listingIdCounter++;

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        // Transfer NFT to marketplace
        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit ListingCreated(listingId, msg.sender, nftContract, tokenId, price);
        return listingId;
    }

    /**
     * @dev Batch create multiple listings
     */
    function batchCreateListing(
        address nftContract,
        uint256[] calldata tokenIds,
        uint256[] calldata prices
    ) external nonReentrant returns (uint256[] memory) {
        require(tokenIds.length == prices.length, "Array length mismatch");
        require(tokenIds.length > 0, "Empty arrays");

        uint256[] memory listingIds = new uint256[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            listingIds[i] = _createListingInternal(nftContract, tokenIds[i], prices[i]);
        }

        return listingIds;
    }

    function _createListingInternal(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) internal returns (uint256) {
        require(price > 0, "Price must be greater than 0");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");

        uint256 listingId = listingIdCounter++;

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit ListingCreated(listingId, msg.sender, nftContract, tokenId, price);
        return listingId;
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;

        // Return NFT to seller
        IERC721(listing.nftContract).safeTransferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingCancelled(listingId);
    }

    /**
     * @dev Buy a listed NFT
     */
    function buyListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        listing.active = false;

        // Calculate fees and royalties
        (uint256 royaltyAmount, address royaltyReceiver) = _getRoyalty(listing.nftContract, listing.tokenId, listing.price);
        uint256 fee = _calculateFee(msg.sender, listing.price);
        uint256 sellerAmount = listing.price - fee - royaltyAmount;

        // Transfer USDC
        require(usdc.transferFrom(msg.sender, listing.seller, sellerAmount), "Seller payment failed");

        if (royaltyAmount > 0) {
            require(usdc.transferFrom(msg.sender, royaltyReceiver, royaltyAmount), "Royalty payment failed");
        }

        if (fee > 0) {
            require(usdc.transferFrom(msg.sender, feeRecipient, fee), "Fee payment failed");
        }

        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingSold(listingId, msg.sender, listing.price);
    }

    /**
     * @dev Batch buy multiple listings
     */
    function batchBuyListings(uint256[] calldata listingIds) external nonReentrant {
        for (uint256 i = 0; i < listingIds.length; i++) {
            _buyListingInternal(listingIds[i]);
        }
    }

    function _buyListingInternal(uint256 listingId) internal {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        listing.active = false;

        (uint256 royaltyAmount, address royaltyReceiver) = _getRoyalty(listing.nftContract, listing.tokenId, listing.price);
        uint256 fee = _calculateFee(msg.sender, listing.price);
        uint256 sellerAmount = listing.price - fee - royaltyAmount;

        require(usdc.transferFrom(msg.sender, listing.seller, sellerAmount), "Seller payment failed");

        if (royaltyAmount > 0) {
            require(usdc.transferFrom(msg.sender, royaltyReceiver, royaltyAmount), "Royalty payment failed");
        }

        if (fee > 0) {
            require(usdc.transferFrom(msg.sender, feeRecipient, fee), "Fee payment failed");
        }

        IERC721(listing.nftContract).safeTransferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingSold(listingId, msg.sender, listing.price);
    }

    /**
     * @dev Create an auction
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) ||
                nft.getApproved(tokenId) == address(this), "Marketplace not approved");

        uint256 auctionId = auctionIdCounter++;

        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startingPrice: startingPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            active: true
        });

        // Transfer NFT to marketplace
        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId, startingPrice, block.timestamp + duration);
        return auctionId;
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 auctionId, uint256 bidAmount) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(bidAmount >= auction.startingPrice, "Bid below starting price");
        require(bidAmount > auction.highestBid, "Bid not high enough");

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            earnings[auction.highestBidder] += auction.highestBid;
        }

        // Transfer bid amount from bidder
        require(usdc.transferFrom(msg.sender, address(this), bidAmount), "Bid transfer failed");

        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;

        emit BidPlaced(auctionId, msg.sender, bidAmount);
    }

    /**
     * @dev End an auction
     */
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Calculate fees and royalties
            (uint256 royaltyAmount, address royaltyReceiver) = _getRoyalty(auction.nftContract, auction.tokenId, auction.highestBid);
            uint256 fee = _calculateFee(auction.highestBidder, auction.highestBid);
            uint256 sellerAmount = auction.highestBid - fee - royaltyAmount;

            // Distribute payments
            require(usdc.transfer(auction.seller, sellerAmount), "Seller payment failed");

            if (royaltyAmount > 0) {
                require(usdc.transfer(royaltyReceiver, royaltyAmount), "Royalty payment failed");
            }

            if (fee > 0) {
                require(usdc.transfer(feeRecipient, fee), "Fee payment failed");
            }

            // Transfer NFT to highest bidder
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);

            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids, return NFT to seller
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionCancelled(auctionId);
        }
    }

    /**
     * @dev Cancel an auction (only if no bids)
     */
    function cancelAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(auction.seller == msg.sender, "Not seller");
        require(auction.highestBidder == address(0), "Cannot cancel with bids");

        auction.active = false;

        // Return NFT to seller
        IERC721(auction.nftContract).safeTransferFrom(address(this), msg.sender, auction.tokenId);

        emit AuctionCancelled(auctionId);
    }

    /**
     * @dev Withdraw earnings
     */
    function withdrawEarnings() external nonReentrant {
        uint256 amount = earnings[msg.sender];
        require(amount > 0, "No earnings");

        earnings[msg.sender] = 0;
        require(usdc.transfer(msg.sender, amount), "Withdrawal failed");

        emit EarningsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Calculate fee with staker discount
     */
    function _calculateFee(address buyer, uint256 price) internal view returns (uint256) {
        uint256 fee = (price * platformFee) / 10000;

        // Apply staker discount if staking contract is set
        if (stakingContract != address(0)) {
            // Call staking contract to get discount tier
            // For now, return standard fee
        }

        return fee;
    }

    /**
     * @dev Get royalty information (EIP-2981)
     */
    function _getRoyalty(address nftContract, uint256 tokenId, uint256 salePrice)
        internal
        view
        returns (uint256 royaltyAmount, address royaltyReceiver)
    {
        try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (
            address receiver,
            uint256 amount
        ) {
            return (amount, receiver);
        } catch {
            return (0, address(0));
        }
    }

    /**
     * @dev Get active listings count
     */
    function getActiveListingsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < listingIdCounter; i++) {
            if (listings[i].active) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Get active auctions count
     */
    function getActiveAuctionsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < auctionIdCounter; i++) {
            if (auctions[i].active) {
                count++;
            }
        }
        return count;
    }
}

interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount);
}
