'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, XOctagon, ChevronDown, ChevronUp } from 'lucide-react';
import type { TokenRiskAssessment, RiskFactor, RiskLevel } from '@/types';

interface RiskBadgeProps {
  risk: TokenRiskAssessment;
  compact?: boolean;
}

const RISK_CONFIG = {
  low: { label: 'LOW RISK', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700', icon: ShieldCheck },
  medium: { label: 'MODERATE', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700', icon: ShieldAlert },
  high: { label: 'HIGH RISK', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700', icon: AlertTriangle },
  critical: { label: 'AVOID', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700', icon: XOctagon },
} as const;

function getOverallConfig(score: number) {
  if (score <= 25) return RISK_CONFIG.low;
  if (score <= 50) return RISK_CONFIG.medium;
  if (score <= 75) return RISK_CONFIG.high;
  return RISK_CONFIG.critical;
}

function getLevelConfig(level: RiskLevel) {
  return RISK_CONFIG[level];
}

export function RiskBadge({ risk, compact = false }: RiskBadgeProps) {
  const config = getOverallConfig(risk.overallScore);
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        <span>{risk.overallScore}</span>
      </div>
    );
  }

  return <RiskBadgeExpanded risk={risk} />;
}

function RiskBadgeExpanded({ risk }: { risk: TokenRiskAssessment }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = getOverallConfig(risk.overallScore);
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg}`}>
            <Icon className={`h-5 w-5 ${config.text}`} />
          </div>
          <div className="text-left">
            <p className={`text-sm font-semibold ${config.text}`}>
              Risk Score: {risk.overallScore}/100
            </p>
            <p className={`text-xs ${config.text} opacity-80`}>
              {config.label} &middot; {risk.recommendation.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className={`h-4 w-4 ${config.text}`} />
        ) : (
          <ChevronDown className={`h-4 w-4 ${config.text}`} />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-inherit px-4 pb-4 space-y-3">
          <RiskFactorRow label="Creator History" factor={risk.creatorRisk} />
          <RiskFactorRow label="Contract Health" factor={risk.contractRisk} />
          <RiskFactorRow label="Trading Patterns" factor={risk.tradingRisk} />
          <RiskFactorRow label="Liquidity & Progress" factor={risk.liquidityRisk} />

          {risk.redFlags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-inherit">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                Red Flags ({risk.redFlags.length})
              </p>
              <ul className="space-y-1">
                {risk.redFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-neutral-500 mt-2">
            Analyzed {new Date(risk.analyzedAt).toLocaleString()} &middot; Based on on-chain data
          </p>
        </div>
      )}
    </div>
  );
}

function RiskFactorRow({ label, factor }: { label: string; factor: RiskFactor }) {
  const levelConfig = getLevelConfig(factor.level);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
        <span className={`text-xs font-medium ${levelConfig.text}`}>
          {factor.score}/100
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div
          className={`h-full rounded-full transition-all ${
            factor.score <= 25 ? 'bg-green-500' : factor.score <= 50 ? 'bg-yellow-500' : factor.score <= 75 ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(factor.score, 100)}%` }}
        />
      </div>
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{factor.details}</p>
    </div>
  );
}
