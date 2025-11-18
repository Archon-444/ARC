import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  User,
  Collection,
  NFT,
  MarketplaceStats,
  DailyStats,
} from "../generated/schema";
import { ERC721 } from "../generated/NFTMarketplace/ERC721";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ZERO_BI = BigInt.fromI32(0);
export const ONE_BI = BigInt.fromI32(1);

/**
 * Get or create User entity
 */
export function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHexString());

  if (user == null) {
    user = new User(address.toHexString());
    user.address = address;
    user.totalSpent = ZERO_BI;
    user.totalEarned = ZERO_BI;
    user.createdAt = getTimestamp();
    user.updatedAt = getTimestamp();
    user.save();

    // Update marketplace stats
    let stats = getOrCreateMarketplaceStats();
    stats.totalUsers = stats.totalUsers.plus(ONE_BI);
    stats.updatedAt = getTimestamp();
    stats.save();
  }

  return user as User;
}

/**
 * Get or create Collection entity
 */
export function getOrCreateCollection(address: Address): Collection {
  let collection = Collection.load(address.toHexString());

  if (collection == null) {
    collection = new Collection(address.toHexString());
    collection.address = address;
    collection.totalVolume = ZERO_BI;
    collection.totalSales = ZERO_BI;
    collection.allowed = false;
    collection.createdAt = getTimestamp();
    collection.updatedAt = getTimestamp();

    // Try to get name and symbol from ERC721 contract
    let erc721 = ERC721.bind(address);
    let nameResult = erc721.try_name();
    let symbolResult = erc721.try_symbol();

    if (!nameResult.reverted) {
      collection.name = nameResult.value;
    }
    if (!symbolResult.reverted) {
      collection.symbol = symbolResult.value;
    }

    collection.save();

    // Update marketplace stats
    let stats = getOrCreateMarketplaceStats();
    stats.totalCollections = stats.totalCollections.plus(ONE_BI);
    stats.updatedAt = getTimestamp();
    stats.save();
  }

  return collection as Collection;
}

/**
 * Get or create NFT entity
 */
export function getOrCreateNFT(
  collectionAddress: Address,
  tokenId: BigInt,
  creatorAddress: Address
): NFT {
  let id = collectionAddress.toHexString() + "-" + tokenId.toString();
  let nft = NFT.load(id);

  if (nft == null) {
    nft = new NFT(id);
    nft.tokenId = tokenId;
    nft.collection = collectionAddress.toHexString();
    nft.creator = creatorAddress.toHexString();
    nft.owner = creatorAddress.toHexString(); // Initially owned by creator
    nft.createdAt = getTimestamp();
    nft.updatedAt = getTimestamp();

    // Try to get tokenURI
    let erc721 = ERC721.bind(collectionAddress);
    let uriResult = erc721.try_tokenURI(tokenId);
    if (!uriResult.reverted) {
      nft.tokenURI = uriResult.value;
    }

    nft.save();
  }

  return nft as NFT;
}

/**
 * Get or create MarketplaceStats singleton
 */
export function getOrCreateMarketplaceStats(): MarketplaceStats {
  let stats = MarketplaceStats.load("marketplace");

  if (stats == null) {
    stats = new MarketplaceStats("marketplace");
    stats.totalVolume = ZERO_BI;
    stats.totalSales = ZERO_BI;
    stats.totalListings = ZERO_BI;
    stats.activeListings = ZERO_BI;
    stats.totalAuctions = ZERO_BI;
    stats.activeAuctions = ZERO_BI;
    stats.totalUsers = ZERO_BI;
    stats.totalCollections = ZERO_BI;
    stats.protocolFeeBps = 250; // Default 2.5%
    stats.updatedAt = getTimestamp();
    stats.save();
  }

  return stats as MarketplaceStats;
}

/**
 * Get or create DailyStats for a given timestamp
 */
export function getOrCreateDailyStats(timestamp: BigInt): DailyStats {
  let dayTimestamp = timestamp.div(BigInt.fromI32(86400)).times(BigInt.fromI32(86400));
  let id = dayTimestamp.toString();
  let stats = DailyStats.load(id);

  if (stats == null) {
    stats = new DailyStats(id);
    stats.date = dayTimestamp;
    stats.volume = ZERO_BI;
    stats.sales = ZERO_BI;
    stats.newUsers = ZERO_BI;
    stats.activeUsers = ZERO_BI;
    stats.newListings = ZERO_BI;
    stats.newAuctions = ZERO_BI;
    stats.save();
  }

  return stats as DailyStats;
}

/**
 * Get current timestamp
 */
export function getTimestamp(): BigInt {
  return BigInt.fromI32(0); // Will be replaced by actual block timestamp in handlers
}

/**
 * Update collection floor price based on active listings
 * Note: This is a simplified version - in production, you'd want to query all active listings
 */
export function updateCollectionFloorPrice(
  collectionAddress: Address,
  price: BigInt
): void {
  let collection = getOrCreateCollection(collectionAddress);

  if (collection.floorPrice == null || price.lt(collection.floorPrice as BigInt)) {
    collection.floorPrice = price;
    collection.updatedAt = getTimestamp();
    collection.save();
  }
}

/**
 * Generate listing ID
 */
export function generateListingId(
  collectionAddress: Address,
  tokenId: BigInt,
  timestamp: BigInt
): string {
  return collectionAddress.toHexString() + "-" + tokenId.toString() + "-" + timestamp.toString();
}

/**
 * Generate auction ID
 */
export function generateAuctionId(
  collectionAddress: Address,
  tokenId: BigInt,
  timestamp: BigInt
): string {
  return collectionAddress.toHexString() + "-" + tokenId.toString() + "-auction-" + timestamp.toString();
}

/**
 * Generate sale ID from transaction hash and log index
 */
export function generateSaleId(txHash: Bytes, logIndex: BigInt): string {
  return txHash.toHexString() + "-" + logIndex.toString();
}

/**
 * Generate bid ID
 */
export function generateBidId(auctionId: string, bidIndex: BigInt): string {
  return auctionId + "-bid-" + bidIndex.toString();
}
