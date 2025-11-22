// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC2981 } from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import { LibMarketplace } from "../libraries/LibMarketplace.sol";
import { LibDiamond } from "../libraries/LibDiamond.sol";

contract MarketplaceFacet {
    // Reentrancy Guard Constants
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    modifier nonReentrant() {
        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        require(ms._status != _ENTERED, "ReentrancyGuard: reentrant call");
        ms._status = _ENTERED;
        _;
        ms._status = _NOT_ENTERED;
    }

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    function initialize(address _usdc, address _feeRecipient) external onlyOwner {
        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        require(address(ms.usdc) == address(0), "Already initialized");
        ms.usdc = IERC20(_usdc);
        ms.feeRecipient = _feeRecipient;
        ms.platformFee = 250; // 2.5%
        ms._status = _NOT_ENTERED;
    }

    // --- Listings ---

    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be > 0");
        
        IERC721 nft = IERC721(nftContract);
        // Transfer NFT to marketplace (Escrow)
        // Note: In a more advanced version, we might use "listing without escrow" (approve only),
        // but for safety and simplicity of the v1 "full fledge" deployable, escrow is safer against front-running approvals.
        // However, OpenSea uses "approve" pattern. Let's stick to Escrow for now as per original design, 
        // but acknowledge that "Approve" pattern is more gas efficient for listing (but requires more checks on buy).
        // Given "flexibility to grow", Escrow is actually LESS flexible. 
        // LET'S SWITCH TO NON-ESCROW (APPROVE PATTERN) for better UX (no gas to list if off-chain, but this is on-chain listing).
        // Actually, for on-chain listing, Escrow is fine. Let's stick to the original safe pattern for now.
        
        nft.transferFrom(msg.sender, address(this), tokenId);

        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        uint256 listingId = ms.listingIdCounter++;

        ms.listings[listingId] = LibMarketplace.Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit LibMarketplace.ListingCreated(listingId, msg.sender, nftContract, tokenId, price);
        return listingId;
    }

    function buyListing(uint256 listingId) external nonReentrant {
        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        LibMarketplace.Listing storage listing = ms.listings[listingId];
        
        require(listing.active, "Listing not active");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        listing.active = false;

        // Payout logic
        _distributePayments(ms, listing.nftContract, listing.tokenId, listing.price, listing.seller);

        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(address(this), msg.sender, listing.tokenId);

        emit LibMarketplace.ListingSold(listingId, msg.sender, listing.price);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        LibMarketplace.Listing storage listing = ms.listings[listingId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;
        
        // Return NFT
        IERC721(listing.nftContract).safeTransferFrom(address(this), msg.sender, listing.tokenId);
        
        emit LibMarketplace.ListingCancelled(listingId);
    }

    // --- Auctions ---

    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(startingPrice > 0, "Price > 0");
        require(duration > 0, "Duration > 0");

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        uint256 auctionId = ms.auctionIdCounter++;

        ms.auctions[auctionId] = LibMarketplace.Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startingPrice: startingPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            active: true
        });

        emit LibMarketplace.AuctionCreated(auctionId, msg.sender, nftContract, tokenId, startingPrice, block.timestamp + duration);
        return auctionId;
    }

    function placeBid(uint256 auctionId, uint256 bidAmount) external nonReentrant {
        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        LibMarketplace.Auction storage auction = ms.auctions[auctionId];

        require(auction.active, "Not active");
        require(block.timestamp < auction.endTime, "Ended");
        require(bidAmount >= auction.startingPrice, "Below start price");
        require(bidAmount > auction.highestBid, "Bid too low");

        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            ms.earnings[auction.highestBidder] += auction.highestBid;
        }

        // Take USDC
        ms.usdc.transferFrom(msg.sender, address(this), bidAmount);

        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;

        emit LibMarketplace.BidPlaced(auctionId, msg.sender, bidAmount);
    }

    function endAuction(uint256 auctionId) external nonReentrant {
        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        LibMarketplace.Auction storage auction = ms.auctions[auctionId];

        require(auction.active, "Not active");
        require(block.timestamp >= auction.endTime, "Not ended yet");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            _distributePayments(ms, auction.nftContract, auction.tokenId, auction.highestBid, auction.seller);
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);
            emit LibMarketplace.AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids, return to seller
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.seller, auction.tokenId);
            emit LibMarketplace.AuctionEnded(auctionId, address(0), 0);
        }
    }

    // --- Helpers ---

    function _distributePayments(
        LibMarketplace.MarketplaceStorage storage ms,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address seller
    ) internal {
        uint256 fee = (price * ms.platformFee) / 10000;
        (address royaltyReceiver, uint256 royaltyAmount) = _getRoyalty(nftContract, tokenId, price);
        
        uint256 sellerAmount = price - fee - royaltyAmount;

        // Transfers
        // Note: In production, we should use SafeERC20 and handle failures gracefully (e.g. push payment pattern)
        // For this implementation, we assume standard USDC behavior (reverts on failure).
        
        if (fee > 0) {
            require(ms.usdc.transfer(ms.feeRecipient, fee), "Fee transfer failed");
        }
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            require(ms.usdc.transfer(royaltyReceiver, royaltyAmount), "Royalty transfer failed");
        }
        require(ms.usdc.transfer(seller, sellerAmount), "Seller transfer failed");
    }

    function _getRoyalty(address nftContract, uint256 tokenId, uint256 salePrice) internal view returns (address, uint256) {
        try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (address receiver, uint256 amount) {
            return (receiver, amount);
        } catch {
            return (address(0), 0);
        }
    }
    
    // --- View Functions ---
    
    function getListing(uint256 listingId) external view returns (LibMarketplace.Listing memory) {
        return LibMarketplace.marketplaceStorage().listings[listingId];
    }
    
    function getAuction(uint256 auctionId) external view returns (LibMarketplace.Auction memory) {
        return LibMarketplace.marketplaceStorage().auctions[auctionId];
    }
}
