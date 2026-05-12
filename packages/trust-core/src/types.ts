export type RiskLevel = 'low' | 'medium' | 'high';
export type RiskRecommendation = 'safe_buy' | 'moderate_buy' | 'speculative' | 'avoid';

export interface ScoringWeights {
  creatorHistory: number;
  contractHealth: number;
  tradingPatterns: number;
  liquidityProgress: number;
}

export interface RiskFactor {
  level: RiskLevel;
  score: number;
  details: string;
}

export interface TokenRiskAssessment {
  overallScore: number;
  creatorRisk: RiskFactor;
  contractRisk: RiskFactor;
  liquidityRisk: RiskFactor;
  tradingRisk: RiskFactor;
  redFlags: string[];
  recommendation: RiskRecommendation;
  analyzedAt: number;
  scoringVersion?: string;
  weights?: ScoringWeights;
  disclaimer?: string;
}
