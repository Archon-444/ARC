import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  ListingCreated,
  ListingUpdated,
  ListingCancelled,
  Purchased,
  AuctionCreated,
  BidPlaced,
  AuctionSettled,
  ProtocolFeeUpdated,
  CollectionAllowed,
} from "../generated/NFTMarketplace/NFTMarketplace";
import {
  Listing,
  Auction,
  Sale,
  NFT,
  Bid,
  User,
  Collection,
  MarketplaceStats,
  DailyStats,
} from "../generated/schema";
import {
  getOrCreateUser,
  getOrCreateCollection,
  getOrCreateNFT,
  getOrCreateMarketplaceStats,
  getOrCreateDailyStats,
  updateCollectionFloorPrice,
  generateListingId,
  generateAuctionId,
  generateSaleId,
  generateBidId,
  ZERO_BI,
  ONE_BI,
} from "./helpers";

export function handleListingCreated(event: ListingCreated): void {
  let seller = getOrCreateUser(event.params.seller);
  let collection = getOrCreateCollection(event.params.collection);
  let nft = getOrCreateNFT(
    event.params.collection,
    event.params.tokenId,
    event.params.seller
  );

  // Create listing
  let listingId = generateListingId(
    event.params.collection,
    event.params.tokenId,
    event.block.timestamp
  );
  let listing = new Listing(listingId);
  listing.collection = collection.id;
  listing.nft = nft.id;
  listing.seller = seller.id;
  listing.price = event.params.price;
  listing.active = true;
  listing.createdAt = event.block.timestamp;
  listing.updatedAt = event.block.timestamp;
  listing.save();

  // Update NFT
  nft.listing = listing.id;
  nft.owner = event.transaction.from.toHexString();
  nft.updatedAt = event.block.timestamp;
  nft.save();

  // Update collection
  collection.updatedAt = event.block.timestamp;
  collection.save();

  // Update floor price
  updateCollectionFloorPrice(event.params.collection, event.params.price);

  // Update marketplace stats
  let stats = getOrCreateMarketplaceStats();
  stats.totalListings = stats.totalListings.plus(ONE_BI);
  stats.activeListings = stats.activeListings.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.newListings = dailyStats.newListings.plus(ONE_BI);
  dailyStats.save();

  log.info("Listing created: {} for collection {} token {}", [
    listingId,
    event.params.collection.toHexString(),
    event.params.tokenId.toString(),
  ]);
}

export function handleListingUpdated(event: ListingUpdated): void {
  let nft = NFT.load(
    event.params.collection.toHexString() + "-" + event.params.tokenId.toString()
  );

  if (nft != null && nft.listing != null) {
    let listing = Listing.load(nft.listing as string);
    if (listing != null) {
      listing.price = event.params.newPrice;
      listing.updatedAt = event.block.timestamp;
      listing.save();

      // Update floor price
      updateCollectionFloorPrice(event.params.collection, event.params.newPrice);
    }
  }
}

export function handleListingCancelled(event: ListingCancelled): void {
  let nft = NFT.load(
    event.params.collection.toHexString() + "-" + event.params.tokenId.toString()
  );

  if (nft != null && nft.listing != null) {
    let listing = Listing.load(nft.listing as string);
    if (listing != null) {
      listing.active = false;
      listing.cancelledAt = event.block.timestamp;
      listing.updatedAt = event.block.timestamp;
      listing.save();

      // Update NFT
      nft.listing = null;
      nft.owner = event.params.seller.toHexString();
      nft.updatedAt = event.block.timestamp;
      nft.save();

      // Update marketplace stats
      let stats = getOrCreateMarketplaceStats();
      stats.activeListings = stats.activeListings.minus(ONE_BI);
      stats.updatedAt = event.block.timestamp;
      stats.save();
    }
  }
}

export function handlePurchased(event: Purchased): void {
  let buyer = getOrCreateUser(event.params.buyer);
  let collection = getOrCreateCollection(event.params.collection);
  let nft = NFT.load(
    event.params.collection.toHexString() + "-" + event.params.tokenId.toString()
  );

  if (nft == null) {
    nft = getOrCreateNFT(
      event.params.collection,
      event.params.tokenId,
      event.transaction.from
    );
  }

  // Get listing
  let listing = nft.listing != null ? Listing.load(nft.listing as string) : null;
  let seller: User | null = null;

  if (listing != null) {
    seller = User.load(listing.seller);

    // Mark listing as sold
    listing.active = false;
    listing.soldAt = event.block.timestamp;
    listing.updatedAt = event.block.timestamp;
    listing.save();

    // Update marketplace stats
    let stats = getOrCreateMarketplaceStats();
    stats.activeListings = stats.activeListings.minus(ONE_BI);
    stats.save();
  }

  // Create sale record
  let saleId = generateSaleId(event.transaction.hash, event.logIndex);
  let sale = new Sale(saleId);
  sale.collection = collection.id;
  sale.nft = nft.id;
  sale.seller = seller != null ? seller.id : nft.owner;
  sale.buyer = buyer.id;
  sale.price = event.params.price;
  sale.saleType = "Listing";
  if (listing != null) {
    sale.listing = listing.id;
  }

  // Calculate fees (2.5% protocol fee)
  let protocolFee = event.params.price.times(BigInt.fromI32(250)).div(BigInt.fromI32(10000));
  sale.protocolFee = protocolFee;
  sale.royaltyFee = ZERO_BI; // Will be tracked via FeeVault events
  sale.createdAt = event.block.timestamp;
  sale.txHash = event.transaction.hash;
  sale.save();

  if (listing != null) {
    listing.sale = sale.id;
    listing.save();
  }

  // Update NFT
  nft.owner = buyer.id;
  nft.listing = null;
  nft.updatedAt = event.block.timestamp;
  nft.save();

  // Update buyer stats
  buyer.totalSpent = buyer.totalSpent.plus(event.params.price);
  buyer.updatedAt = event.block.timestamp;
  buyer.save();

  // Update seller stats if known
  if (seller != null) {
    seller.totalEarned = seller.totalEarned.plus(event.params.price);
    seller.updatedAt = event.block.timestamp;
    seller.save();
  }

  // Update collection stats
  collection.totalVolume = collection.totalVolume.plus(event.params.price);
  collection.totalSales = collection.totalSales.plus(ONE_BI);
  collection.updatedAt = event.block.timestamp;
  collection.save();

  // Update marketplace stats
  let stats = getOrCreateMarketplaceStats();
  stats.totalVolume = stats.totalVolume.plus(event.params.price);
  stats.totalSales = stats.totalSales.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.volume = dailyStats.volume.plus(event.params.price);
  dailyStats.sales = dailyStats.sales.plus(ONE_BI);
  dailyStats.save();

  log.info("Purchase completed: {} bought token {} from collection {} for {}", [
    buyer.id,
    event.params.tokenId.toString(),
    collection.id,
    event.params.price.toString(),
  ]);
}

export function handleAuctionCreated(event: AuctionCreated): void {
  let seller = getOrCreateUser(event.params.seller);
  let collection = getOrCreateCollection(event.params.collection);
  let nft = getOrCreateNFT(
    event.params.collection,
    event.params.tokenId,
    event.params.seller
  );

  // Create auction
  let auctionId = generateAuctionId(
    event.params.collection,
    event.params.tokenId,
    event.block.timestamp
  );
  let auction = new Auction(auctionId);
  auction.collection = collection.id;
  auction.nft = nft.id;
  auction.seller = seller.id;
  auction.reservePrice = event.params.reservePrice;
  auction.startTime = BigInt.fromI32(event.params.startTime);
  auction.endTime = BigInt.fromI32(event.params.endTime);
  auction.settled = false;
  auction.createdAt = event.block.timestamp;
  auction.save();

  // Update NFT
  nft.auction = auction.id;
  nft.owner = event.transaction.from.toHexString();
  nft.updatedAt = event.block.timestamp;
  nft.save();

  // Update marketplace stats
  let stats = getOrCreateMarketplaceStats();
  stats.totalAuctions = stats.totalAuctions.plus(ONE_BI);
  stats.activeAuctions = stats.activeAuctions.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.newAuctions = dailyStats.newAuctions.plus(ONE_BI);
  dailyStats.save();

  log.info("Auction created: {} for collection {} token {}", [
    auctionId,
    event.params.collection.toHexString(),
    event.params.tokenId.toString(),
  ]);
}

export function handleBidPlaced(event: BidPlaced): void {
  let bidder = getOrCreateUser(event.params.bidder);
  let nft = NFT.load(
    event.params.collection.toHexString() + "-" + event.params.tokenId.toString()
  );

  if (nft != null && nft.auction != null) {
    let auction = Auction.load(nft.auction as string);
    if (auction != null) {
      // Create bid record
      let bidCount = auction.bids.length;
      let bidId = generateBidId(auction.id, BigInt.fromI32(bidCount));
      let bid = new Bid(bidId);
      bid.auction = auction.id;
      bid.bidder = bidder.id;
      bid.amount = event.params.amount;
      bid.refunded = false;
      bid.createdAt = event.block.timestamp;
      bid.save();

      // Mark previous highest bidder's bid as refunded
      if (auction.highestBidder != null) {
        let previousBidderId = generateBidId(auction.id, BigInt.fromI32(bidCount - 1));
        let previousBid = Bid.load(previousBidderId);
        if (previousBid != null) {
          previousBid.refunded = true;
          previousBid.refundedAt = event.block.timestamp;
          previousBid.save();
        }
      }

      // Update auction
      auction.highestBid = event.params.amount;
      auction.highestBidder = bidder.id;
      auction.save();
    }
  }
}

export function handleAuctionSettled(event: AuctionSettled): void {
  let nft = NFT.load(
    event.params.collection.toHexString() + "-" + event.params.tokenId.toString()
  );

  if (nft == null) {
    nft = getOrCreateNFT(
      event.params.collection,
      event.params.tokenId,
      event.transaction.from
    );
  }

  if (nft.auction != null) {
    let auction = Auction.load(nft.auction as string);
    if (auction != null) {
      auction.settled = true;
      auction.settledAt = event.block.timestamp;
      auction.save();

      // Update marketplace stats
      let stats = getOrCreateMarketplaceStats();
      stats.activeAuctions = stats.activeAuctions.minus(ONE_BI);
      stats.save();

      // If there was a winning bid, create sale record
      if (event.params.amount.gt(ZERO_BI) && event.params.winner.toHexString() != "0x0000000000000000000000000000000000000000") {
        let winner = getOrCreateUser(event.params.winner);
        let seller = User.load(auction.seller);
        let collection = getOrCreateCollection(event.params.collection);

        let saleId = generateSaleId(event.transaction.hash, event.logIndex);
        let sale = new Sale(saleId);
        sale.collection = collection.id;
        sale.nft = nft.id;
        sale.seller = auction.seller;
        sale.buyer = winner.id;
        sale.price = event.params.amount;
        sale.saleType = "Auction";
        sale.auction = auction.id;

        // Calculate fees
        let protocolFee = event.params.amount.times(BigInt.fromI32(250)).div(BigInt.fromI32(10000));
        sale.protocolFee = protocolFee;
        sale.royaltyFee = ZERO_BI;
        sale.createdAt = event.block.timestamp;
        sale.txHash = event.transaction.hash;
        sale.save();

        auction.sale = sale.id;
        auction.save();

        // Update NFT owner
        nft.owner = winner.id;
        nft.auction = null;
        nft.updatedAt = event.block.timestamp;
        nft.save();

        // Update buyer stats
        winner.totalSpent = winner.totalSpent.plus(event.params.amount);
        winner.updatedAt = event.block.timestamp;
        winner.save();

        // Update seller stats
        if (seller != null) {
          seller.totalEarned = seller.totalEarned.plus(event.params.amount);
          seller.updatedAt = event.block.timestamp;
          seller.save();
        }

        // Update collection stats
        collection.totalVolume = collection.totalVolume.plus(event.params.amount);
        collection.totalSales = collection.totalSales.plus(ONE_BI);
        collection.updatedAt = event.block.timestamp;
        collection.save();

        // Update marketplace stats
        stats.totalVolume = stats.totalVolume.plus(event.params.amount);
        stats.totalSales = stats.totalSales.plus(ONE_BI);
        stats.updatedAt = event.block.timestamp;
        stats.save();

        // Update daily stats
        let dailyStats = getOrCreateDailyStats(event.block.timestamp);
        dailyStats.volume = dailyStats.volume.plus(event.params.amount);
        dailyStats.sales = dailyStats.sales.plus(ONE_BI);
        dailyStats.save();
      } else {
        // No winning bid - return NFT to seller
        let seller = User.load(auction.seller);
        if (seller != null) {
          nft.owner = seller.id;
          nft.auction = null;
          nft.updatedAt = event.block.timestamp;
          nft.save();
        }
      }
    }
  }
}

export function handleProtocolFeeUpdated(event: ProtocolFeeUpdated): void {
  let stats = getOrCreateMarketplaceStats();
  stats.protocolFeeBps = event.params.newFeeBps;
  stats.updatedAt = event.block.timestamp;
  stats.save();

  log.info("Protocol fee updated from {} to {}", [
    event.params.oldFeeBps.toString(),
    event.params.newFeeBps.toString(),
  ]);
}

export function handleCollectionAllowed(event: CollectionAllowed): void {
  let collection = getOrCreateCollection(event.params.collection);
  collection.allowed = event.params.allowed;
  collection.updatedAt = event.block.timestamp;
  collection.save();

  log.info("Collection {} allowed status: {}", [
    collection.id,
    event.params.allowed ? "true" : "false",
  ]);
}
