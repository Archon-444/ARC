import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  TokensBought,
  TokensSold,
  TokenGraduated,
  StakingStarted,
  StakingRewardsClaimed,
  CreatorReserveWithdrawn,
} from "../generated/templates/ArcBondingCurveAMM/ArcBondingCurveAMM";
import {
  LaunchedToken,
  TokenTrade,
  TokenGraduation,
  TokenStake,
  TokenRewardClaim,
  CreatorWithdrawal,
  AmmTokenLookup,
} from "../generated/schema";
import { getOrCreateTokenLauncherStats } from "./arc-token-factory";
import { ZERO_BI, ONE_BI } from "./helpers";

/**
 * Resolve AMM address → LaunchedToken entity via lookup table
 */
function getTokenByAmm(ammAddress: string): LaunchedToken | null {
  let lookup = AmmTokenLookup.load(ammAddress);
  if (lookup == null) {
    log.warning("AmmTokenLookup not found for AMM {}", [ammAddress]);
    return null;
  }
  return LaunchedToken.load(lookup.token);
}

/**
 * Generate unique ID from transaction hash and log index
 */
function generateEventId(txHash: string, logIndex: BigInt): string {
  return txHash + "-" + logIndex.toString();
}

/**
 * Handle TokensBought(indexed address buyer, uint256 usdcAmount, uint256 tokensOut,
 *   uint256 platformFee, uint256 newPrice, uint256 timestamp)
 */
export function handleTokensBought(event: TokensBought): void {
  let token = getTokenByAmm(event.address.toHexString());
  if (token == null) return;

  // Create trade record
  let tradeId = generateEventId(
    event.transaction.hash.toHexString(),
    event.logIndex
  );
  let trade = new TokenTrade(tradeId);
  trade.token = token.id;
  trade.trader = event.params.buyer;
  trade.tradeType = "Buy";
  trade.usdcAmount = event.params.usdcAmount;
  trade.tokenAmount = event.params.tokensOut;
  trade.platformFee = event.params.platformFee;
  trade.newPrice = event.params.newPrice;
  trade.createdAt = event.params.timestamp;
  trade.txHash = event.transaction.hash;
  trade.save();

  // Update token aggregate stats
  token.soldSupply = token.soldSupply.plus(event.params.tokensOut);
  token.totalVolume = token.totalVolume.plus(event.params.usdcAmount);
  token.totalTrades = token.totalTrades.plus(ONE_BI);
  token.updatedAt = event.block.timestamp;
  token.save();

  // Update global stats
  let stats = getOrCreateTokenLauncherStats();
  stats.totalVolume = stats.totalVolume.plus(event.params.usdcAmount);
  stats.totalTrades = stats.totalTrades.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  log.info("Tokens bought: buyer={} usdc={} tokens={}", [
    event.params.buyer.toHexString(),
    event.params.usdcAmount.toString(),
    event.params.tokensOut.toString(),
  ]);
}

/**
 * Handle TokensSold(indexed address seller, uint256 tokenAmount, uint256 usdcOut,
 *   uint256 platformFee, uint256 newPrice, uint256 timestamp)
 */
export function handleTokensSold(event: TokensSold): void {
  let token = getTokenByAmm(event.address.toHexString());
  if (token == null) return;

  // Create trade record
  let tradeId = generateEventId(
    event.transaction.hash.toHexString(),
    event.logIndex
  );
  let trade = new TokenTrade(tradeId);
  trade.token = token.id;
  trade.trader = event.params.seller;
  trade.tradeType = "Sell";
  trade.usdcAmount = event.params.usdcOut;
  trade.tokenAmount = event.params.tokenAmount;
  trade.platformFee = event.params.platformFee;
  trade.newPrice = event.params.newPrice;
  trade.createdAt = event.params.timestamp;
  trade.txHash = event.transaction.hash;
  trade.save();

  // Update token aggregate stats
  token.soldSupply = token.soldSupply.minus(event.params.tokenAmount);
  token.totalVolume = token.totalVolume.plus(event.params.usdcOut);
  token.totalTrades = token.totalTrades.plus(ONE_BI);
  token.updatedAt = event.block.timestamp;
  token.save();

  // Update global stats
  let stats = getOrCreateTokenLauncherStats();
  stats.totalVolume = stats.totalVolume.plus(event.params.usdcOut);
  stats.totalTrades = stats.totalTrades.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  log.info("Tokens sold: seller={} tokens={} usdc={}", [
    event.params.seller.toHexString(),
    event.params.tokenAmount.toString(),
    event.params.usdcOut.toString(),
  ]);
}

/**
 * Handle TokenGraduated(uint256 creatorReserve, uint256 stakingRewardPool,
 *   uint256 platformFee, uint256 finalSupply, uint256 timestamp)
 */
export function handleTokenGraduated(event: TokenGraduated): void {
  let token = getTokenByAmm(event.address.toHexString());
  if (token == null) return;

  // Create graduation record (one per token)
  let graduation = new TokenGraduation(token.id);
  graduation.token = token.id;
  graduation.creatorReserve = event.params.creatorReserve;
  graduation.stakingRewardPool = event.params.stakingRewardPool;
  graduation.platformFee = event.params.platformFee;
  graduation.finalSupply = event.params.finalSupply;
  graduation.createdAt = event.params.timestamp;
  graduation.txHash = event.transaction.hash;
  graduation.save();

  // Update token
  token.isGraduated = true;
  token.graduation = graduation.id;
  token.updatedAt = event.block.timestamp;
  token.save();

  // Update global stats
  let stats = getOrCreateTokenLauncherStats();
  stats.totalGraduated = stats.totalGraduated.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  log.info("Token graduated: token={} reserve={} staking={} platform={}", [
    token.id,
    event.params.creatorReserve.toString(),
    event.params.stakingRewardPool.toString(),
    event.params.platformFee.toString(),
  ]);
}

/**
 * Handle StakingStarted(indexed address user, uint256 tokenAmount, uint256 timestamp)
 */
export function handleStakingStarted(event: StakingStarted): void {
  let token = getTokenByAmm(event.address.toHexString());
  if (token == null) return;

  let stakeId = generateEventId(
    event.transaction.hash.toHexString(),
    event.logIndex
  );
  let stake = new TokenStake(stakeId);
  stake.token = token.id;
  stake.user = event.params.user;
  stake.amount = event.params.tokenAmount;
  stake.createdAt = event.params.timestamp;
  stake.txHash = event.transaction.hash;
  stake.save();

  token.updatedAt = event.block.timestamp;
  token.save();

  log.info("Staking started: user={} amount={}", [
    event.params.user.toHexString(),
    event.params.tokenAmount.toString(),
  ]);
}

/**
 * Handle StakingRewardsClaimed(indexed address user, uint256 rewardAmount,
 *   uint256 tokensStaked, uint256 timestamp)
 */
export function handleStakingRewardsClaimed(
  event: StakingRewardsClaimed
): void {
  let token = getTokenByAmm(event.address.toHexString());
  if (token == null) return;

  let claimId = generateEventId(
    event.transaction.hash.toHexString(),
    event.logIndex
  );
  let claim = new TokenRewardClaim(claimId);
  claim.token = token.id;
  claim.user = event.params.user;
  claim.rewardAmount = event.params.rewardAmount;
  claim.tokensStaked = event.params.tokensStaked;
  claim.createdAt = event.params.timestamp;
  claim.txHash = event.transaction.hash;
  claim.save();

  token.updatedAt = event.block.timestamp;
  token.save();

  log.info("Rewards claimed: user={} reward={}", [
    event.params.user.toHexString(),
    event.params.rewardAmount.toString(),
  ]);
}

/**
 * Handle CreatorReserveWithdrawn(indexed address creator, uint256 usdcAmount,
 *   string reason, uint256 timestamp)
 */
export function handleCreatorReserveWithdrawn(
  event: CreatorReserveWithdrawn
): void {
  let token = getTokenByAmm(event.address.toHexString());
  if (token == null) return;

  let withdrawalId = generateEventId(
    event.transaction.hash.toHexString(),
    event.logIndex
  );
  let withdrawal = new CreatorWithdrawal(withdrawalId);
  withdrawal.token = token.id;
  withdrawal.creator = event.params.creator;
  withdrawal.amount = event.params.usdcAmount;
  withdrawal.reason = event.params.reason;
  withdrawal.createdAt = event.params.timestamp;
  withdrawal.txHash = event.transaction.hash;
  withdrawal.save();

  token.updatedAt = event.block.timestamp;
  token.save();

  log.info("Creator reserve withdrawn: creator={} amount={} reason={}", [
    event.params.creator.toHexString(),
    event.params.usdcAmount.toString(),
    event.params.reason,
  ]);
}
