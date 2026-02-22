import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  ListingCreated,
  ListingCancelled,
  ListingSold,
  AuctionCreated,
  BidPlaced,
  AuctionEnded,
  AuctionCancelled,
  AuctionExtended,
  PlatformFeeUpdated,
  EarningsWithdrawn,
} from "../generated/ArcMarketplace/ArcMarketplace";
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
  generateSaleId,
  generateBidId,
  ZERO_BI,
  ONE_BI,
} from "./helpers";

/**
 * Handle ListingCreated(indexed uint256 listingId, indexed address seller,
 *   address nftContract, uint256 tokenId, uint256 price)
 */
export function handleListingCreated(event: ListingCreated): void {
  let seller = getOrCreateUser(event.params.seller);
  let collection = getOrCreateCollection(event.params.nftContract);
  let nft = getOrCreateNFT(
    event.params.nftContract,
    event.params.tokenId,
    event.params.seller
  );

  // Use the on-chain listingId as the entity ID
  let listingId = event.params.listingId.toString();
  let listing = new Listing(listingId);
  listing.listingId = event.params.listingId;
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
  nft.owner = event.params.seller.toHexString();
  nft.updatedAt = event.block.timestamp;
  nft.save();

  // Update collection
  collection.updatedAt = event.block.timestamp;
  collection.save();

  // Update floor price
  updateCollectionFloorPrice(event.params.nftContract, event.params.price);

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

  log.info("Listing created: id={} collection={} token={}", [
    listingId,
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString(),
  ]);
}

/**
 * Handle ListingCancelled(indexed uint256 listingId)
 */
export function handleListingCancelled(event: ListingCancelled): void {
  let listingId = event.params.listingId.toString();
  let listing = Listing.load(listingId);

  if (listing != null) {
    listing.active = false;
    listing.cancelledAt = event.block.timestamp;
    listing.updatedAt = event.block.timestamp;
    listing.save();

    // Update NFT
    let nft = NFT.load(listing.nft);
    if (nft != null) {
      nft.listing = null;
      nft.updatedAt = event.block.timestamp;
      nft.save();
    }

    // Update marketplace stats
    let stats = getOrCreateMarketplaceStats();
    stats.activeListings = stats.activeListings.minus(ONE_BI);
    stats.updatedAt = event.block.timestamp;
    stats.save();
  }
}

/**
 * Handle ListingSold(indexed uint256 listingId, indexed address buyer, uint256 price)
 */
export function handleListingSold(event: ListingSold): void {
  let buyer = getOrCreateUser(event.params.buyer);
  let listingId = event.params.listingId.toString();
  let listing = Listing.load(listingId);

  if (listing == null) {
    log.warning("ListingSold: listing {} not found", [listingId]);
    return;
  }

  let seller = User.load(listing.seller);
  let nft = NFT.load(listing.nft);
  let collection = Collection.load(listing.collection);

  // Mark listing as sold
  listing.active = false;
  listing.soldAt = event.block.timestamp;
  listing.updatedAt = event.block.timestamp;

  // Create sale record
  let saleId = generateSaleId(event.transaction.hash, event.logIndex);
  let sale = new Sale(saleId);
  sale.collection = listing.collection;
  sale.nft = listing.nft;
  sale.seller = listing.seller;
  sale.buyer = buyer.id;
  sale.price = event.params.price;
  sale.saleType = "Listing";
  sale.listing = listing.id;

  // Calculate fees (2.5% protocol fee estimate)
  let protocolFee = event.params.price
    .times(BigInt.fromI32(250))
    .div(BigInt.fromI32(10000));
  sale.protocolFee = protocolFee;
  sale.royaltyFee = ZERO_BI;
  sale.createdAt = event.block.timestamp;
  sale.txHash = event.transaction.hash;
  sale.save();

  listing.sale = sale.id;
  listing.save();

  // Update NFT
  if (nft != null) {
    nft.owner = buyer.id;
    nft.listing = null;
    nft.updatedAt = event.block.timestamp;
    nft.save();
  }

  // Update buyer stats
  buyer.totalSpent = buyer.totalSpent.plus(event.params.price);
  buyer.updatedAt = event.block.timestamp;
  buyer.save();

  // Update seller stats
  if (seller != null) {
    seller.totalEarned = seller.totalEarned.plus(event.params.price);
    seller.updatedAt = event.block.timestamp;
    seller.save();
  }

  // Update collection stats
  if (collection != null) {
    collection.totalVolume = collection.totalVolume.plus(event.params.price);
    collection.totalSales = collection.totalSales.plus(ONE_BI);
    collection.updatedAt = event.block.timestamp;
    collection.save();
  }

  // Update marketplace stats
  let stats = getOrCreateMarketplaceStats();
  stats.activeListings = stats.activeListings.minus(ONE_BI);
  stats.totalVolume = stats.totalVolume.plus(event.params.price);
  stats.totalSales = stats.totalSales.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.volume = dailyStats.volume.plus(event.params.price);
  dailyStats.sales = dailyStats.sales.plus(ONE_BI);
  dailyStats.save();

  log.info("Listing sold: id={} buyer={} price={}", [
    listingId,
    buyer.id,
    event.params.price.toString(),
  ]);
}

/**
 * Handle AuctionCreated(indexed uint256 auctionId, indexed address seller,
 *   address nftContract, uint256 tokenId, uint256 startingPrice, uint256 endTime)
 */
export function handleAuctionCreated(event: AuctionCreated): void {
  let seller = getOrCreateUser(event.params.seller);
  let collection = getOrCreateCollection(event.params.nftContract);
  let nft = getOrCreateNFT(
    event.params.nftContract,
    event.params.tokenId,
    event.params.seller
  );

  // Use the on-chain auctionId as the entity ID
  let auctionId = event.params.auctionId.toString();
  let auction = new Auction(auctionId);
  auction.auctionId = event.params.auctionId;
  auction.collection = collection.id;
  auction.nft = nft.id;
  auction.seller = seller.id;
  auction.startingPrice = event.params.startingPrice;
  auction.endTime = event.params.endTime;
  auction.extensionCount = 0;
  auction.active = true;
  auction.settled = false;
  auction.createdAt = event.block.timestamp;
  auction.save();

  // Update NFT
  nft.auction = auction.id;
  nft.owner = event.params.seller.toHexString();
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

  log.info("Auction created: id={} collection={} token={}", [
    auctionId,
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString(),
  ]);
}

/**
 * Handle BidPlaced(indexed uint256 auctionId, indexed address bidder, uint256 amount)
 */
export function handleBidPlaced(event: BidPlaced): void {
  let bidder = getOrCreateUser(event.params.bidder);
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);

  if (auction == null) {
    log.warning("BidPlaced: auction {} not found", [auctionId]);
    return;
  }

  // Create bid record
  let bidIndex = auction.highestBid != null ? ONE_BI : ZERO_BI;
  // Use tx hash + log index for unique bid ID
  let bidId = generateBidId(
    auctionId,
    event.transaction.hash,
    event.logIndex
  );
  let bid = new Bid(bidId);
  bid.auction = auction.id;
  bid.bidder = bidder.id;
  bid.amount = event.params.amount;
  bid.refunded = false;
  bid.createdAt = event.block.timestamp;
  bid.save();

  // Update auction
  auction.highestBid = event.params.amount;
  auction.highestBidder = bidder.id;
  auction.save();
}

/**
 * Handle AuctionEnded(indexed uint256 auctionId, indexed address winner, uint256 amount)
 */
export function handleAuctionEnded(event: AuctionEnded): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);

  if (auction == null) {
    log.warning("AuctionEnded: auction {} not found", [auctionId]);
    return;
  }

  auction.active = false;
  auction.settled = true;
  auction.settledAt = event.block.timestamp;

  let nft = NFT.load(auction.nft);
  let collection = Collection.load(auction.collection);

  // Update marketplace stats
  let stats = getOrCreateMarketplaceStats();
  stats.activeAuctions = stats.activeAuctions.minus(ONE_BI);

  // Winner exists — create sale record
  if (
    event.params.amount.gt(ZERO_BI) &&
    event.params.winner.toHexString() !=
      "0x0000000000000000000000000000000000000000"
  ) {
    let winner = getOrCreateUser(event.params.winner);
    let seller = User.load(auction.seller);

    let saleId = generateSaleId(event.transaction.hash, event.logIndex);
    let sale = new Sale(saleId);
    sale.collection = auction.collection;
    sale.nft = auction.nft;
    sale.seller = auction.seller;
    sale.buyer = winner.id;
    sale.price = event.params.amount;
    sale.saleType = "Auction";
    sale.auction = auction.id;

    // Calculate fees (2.5% estimate)
    let protocolFee = event.params.amount
      .times(BigInt.fromI32(250))
      .div(BigInt.fromI32(10000));
    sale.protocolFee = protocolFee;
    sale.royaltyFee = ZERO_BI;
    sale.createdAt = event.block.timestamp;
    sale.txHash = event.transaction.hash;
    sale.save();

    auction.sale = sale.id;

    // Update NFT owner
    if (nft != null) {
      nft.owner = winner.id;
      nft.auction = null;
      nft.updatedAt = event.block.timestamp;
      nft.save();
    }

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
    if (collection != null) {
      collection.totalVolume = collection.totalVolume.plus(
        event.params.amount
      );
      collection.totalSales = collection.totalSales.plus(ONE_BI);
      collection.updatedAt = event.block.timestamp;
      collection.save();
    }

    // Update marketplace volume stats
    stats.totalVolume = stats.totalVolume.plus(event.params.amount);
    stats.totalSales = stats.totalSales.plus(ONE_BI);

    // Update daily stats
    let dailyStats = getOrCreateDailyStats(event.block.timestamp);
    dailyStats.volume = dailyStats.volume.plus(event.params.amount);
    dailyStats.sales = dailyStats.sales.plus(ONE_BI);
    dailyStats.save();
  } else {
    // No bids — return NFT to seller
    if (nft != null) {
      nft.owner = auction.seller;
      nft.auction = null;
      nft.updatedAt = event.block.timestamp;
      nft.save();
    }
  }

  auction.save();

  stats.updatedAt = event.block.timestamp;
  stats.save();
}

/**
 * Handle AuctionCancelled(indexed uint256 auctionId)
 */
export function handleAuctionCancelled(event: AuctionCancelled): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);

  if (auction == null) {
    log.warning("AuctionCancelled: auction {} not found", [auctionId]);
    return;
  }

  auction.active = false;
  auction.settled = true;
  auction.settledAt = event.block.timestamp;
  auction.save();

  // Return NFT to seller
  let nft = NFT.load(auction.nft);
  if (nft != null) {
    nft.owner = auction.seller;
    nft.auction = null;
    nft.updatedAt = event.block.timestamp;
    nft.save();
  }

  // Update marketplace stats
  let stats = getOrCreateMarketplaceStats();
  stats.activeAuctions = stats.activeAuctions.minus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

/**
 * Handle AuctionExtended(indexed uint256 auctionId, uint256 newEndTime)
 */
export function handleAuctionExtended(event: AuctionExtended): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);

  if (auction != null) {
    auction.endTime = event.params.newEndTime;
    auction.extensionCount = auction.extensionCount + 1;
    auction.save();

    log.info("Auction extended: id={} newEndTime={}", [
      auctionId,
      event.params.newEndTime.toString(),
    ]);
  }
}

/**
 * Handle PlatformFeeUpdated(uint256 newFee)
 */
export function handlePlatformFeeUpdated(event: PlatformFeeUpdated): void {
  let stats = getOrCreateMarketplaceStats();
  stats.protocolFeeBps = event.params.newFee.toI32();
  stats.updatedAt = event.block.timestamp;
  stats.save();

  log.info("Platform fee updated to {}", [event.params.newFee.toString()]);
}

/**
 * Handle EarningsWithdrawn(indexed address user, uint256 amount)
 */
export function handleEarningsWithdrawn(event: EarningsWithdrawn): void {
  let user = getOrCreateUser(event.params.user);
  user.updatedAt = event.block.timestamp;
  user.save();

  log.info("Earnings withdrawn: user={} amount={}", [
    user.id,
    event.params.amount.toString(),
  ]);
}
