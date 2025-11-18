import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  Distributed,
  GlobalSplitsUpdated,
  CollectionSplitsUpdated,
} from "../generated/FeeVault/FeeVault";
import { FeeDistribution, FeeSplit } from "../generated/schema";
import { getOrCreateCollection, generateSaleId, ZERO_BI } from "./helpers";

export function handleDistributed(event: Distributed): void {
  let collection = getOrCreateCollection(event.params.collection);

  // Create fee distribution record
  let distributionId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let distribution = new FeeDistribution(distributionId);
  distribution.collection = collection.id;
  distribution.tokenId = event.params.tokenId;
  distribution.amount = event.params.amount;
  distribution.collectionSplits = [];
  distribution.globalSplits = [];
  distribution.createdAt = event.block.timestamp;
  distribution.txHash = event.transaction.hash;
  distribution.save();

  // Note: Individual splits are tracked via the FeeVault contract state
  // In a production subgraph, you might want to call the contract directly
  // to get the split details and create FeeSplit entities

  log.info("Fee distributed for collection {} token {} amount {}", [
    event.params.collection.toHexString(),
    event.params.tokenId.toString(),
    event.params.amount.toString(),
  ]);
}

export function handleGlobalSplitsUpdated(event: GlobalSplitsUpdated): void {
  // Note: The splits parameter is an array of tuples (address, uint16)
  // You could store these in a separate GlobalSplitConfig entity if needed
  // For now, we just log the update

  log.info("Global splits updated at block {}", [event.block.number.toString()]);
}

export function handleCollectionSplitsUpdated(event: CollectionSplitsUpdated): void {
  let collection = getOrCreateCollection(event.params.collection);
  collection.updatedAt = event.block.timestamp;
  collection.save();

  // Note: The actual splits would need to be queried from the contract
  // or tracked via additional events if you want to store them in the subgraph

  log.info("Collection splits updated for {}", [collection.id]);
}
