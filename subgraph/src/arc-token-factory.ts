import { BigInt, log } from "@graphprotocol/graph-ts";
import { TokenCreated } from "../generated/ArcTokenFactory/ArcTokenFactory";
import { ArcBondingCurveAMM } from "../generated/templates";
import { LaunchedToken, TokenLauncherStats, AmmTokenLookup } from "../generated/schema";
import { ZERO_BI, ONE_BI } from "./helpers";

/**
 * Get or create TokenLauncherStats singleton
 */
export function getOrCreateTokenLauncherStats(): TokenLauncherStats {
  let stats = TokenLauncherStats.load("token-launcher");

  if (stats == null) {
    stats = new TokenLauncherStats("token-launcher");
    stats.totalTokens = ZERO_BI;
    stats.totalVolume = ZERO_BI;
    stats.totalTrades = ZERO_BI;
    stats.totalGraduated = ZERO_BI;
    stats.updatedAt = ZERO_BI;
    stats.save();
  }

  return stats as TokenLauncherStats;
}

/**
 * Handle TokenCreated(indexed address tokenAddress, indexed address ammAddress,
 *   indexed address creator, string name, string symbol,
 *   uint256 totalSupply, uint256 creationFeeUSDC, uint256 timestamp)
 */
export function handleTokenCreated(event: TokenCreated): void {
  let tokenId = event.params.tokenAddress.toHexString();
  let token = new LaunchedToken(tokenId);

  token.address = event.params.tokenAddress;
  token.amm = event.params.ammAddress;
  token.creator = event.params.creator;
  token.name = event.params.name;
  token.symbol = event.params.symbol;
  token.totalSupply = event.params.totalSupply;
  token.creationFee = event.params.creationFeeUSDC;
  token.currentSupply = ZERO_BI;
  token.totalVolume = ZERO_BI;
  token.totalTrades = ZERO_BI;
  token.isGraduated = false;
  token.createdAt = event.params.timestamp;
  token.updatedAt = event.params.timestamp;
  token.save();

  // Create reverse lookup: AMM address → token
  let lookup = new AmmTokenLookup(event.params.ammAddress.toHexString());
  lookup.token = tokenId;
  lookup.save();

  // Start indexing events from this AMM contract
  ArcBondingCurveAMM.create(event.params.ammAddress);

  // Update global stats
  let stats = getOrCreateTokenLauncherStats();
  stats.totalTokens = stats.totalTokens.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  log.info("Token created: {} ({}) amm={} creator={}", [
    event.params.name,
    event.params.symbol,
    event.params.ammAddress.toHexString(),
    event.params.creator.toHexString(),
  ]);
}
