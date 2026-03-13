/**
 * LauncherTokenCard – list card for tokens using subgraph data only (no chain reads).
 * Used in Explore/Home token discovery for new/trending/graduating sections.
 */

'use client';

import Link from 'next/link';
import { Award, ExternalLink, Globe } from 'lucide-react';

function normalizeUrl(url: string | undefined): string | null {
  if (!url || !url.trim()) return null;
  const u = url.trim();
  return u.startsWith('http') ? u : `https://${u}`;
}

export interface LaunchedTokenFeedItem {
  id: string;
  address?: string;
  name?: string;
  symbol?: string;
  totalSupply?: string | number;
  soldSupply?: string | number;
  totalVolume?: string | number;
  totalTrades?: string | number;
  isGraduated?: boolean;
  createdAt?: string | number;
  updatedAt?: string | number;
  /** Optional social links (from token metadata when available) */
  links?: { website?: string; x?: string; telegram?: string };
}

function curveProgress(token: LaunchedTokenFeedItem): number {
  const total = Number(token.totalSupply || 1);
  const sold = Number(token.soldSupply || 0);
  return total > 0 ? Math.min(100, (sold / total) * 100) : 0;
}

function formatAge(createdAt: string | number | undefined): string {
  if (!createdAt) return 'Just now';
  const ts = typeof createdAt === 'string' ? parseInt(createdAt, 10) : createdAt;
  const ms = (typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts) as number;
  const mins = Math.max(1, Math.floor((Date.now() - ms) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatVolume(totalVolume: string | number | undefined): string {
  const v = Number(totalVolume || 0) / 1_000_000;
  if (v >= 1000) return `$${(v / 1000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

function badge(token: LaunchedTokenFeedItem, progress: number): string {
  if (token.isGraduated) return 'Graduated';
  if (progress > 75) return 'Near graduation';
  const traders = Number(token.totalTrades || 0);
  const hotness = Math.min(99, 40 + traders * 3 + progress / 2);
  return hotness > 72 ? 'Momentum' : 'Fresh launch';
}

export function LauncherTokenCard({ token }: { token: LaunchedTokenFeedItem }) {
  const address = token.id || token.address || '';
  const progress = curveProgress(token);
  const name = token.name || `Token`;
  const symbol = token.symbol || 'ARC';
  const volume = formatVolume(token.totalVolume);
  const traders = Number(token.totalTrades || 0);
  const age = formatAge(token.createdAt);

  return (
    <Link
      href={`/token/${address}`}
      className="card card-hover group block p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {symbol.charAt(0) || '?'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            {badge(token, progress)}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-neutral-900 dark:text-white">{name}</h3>
            {token.isGraduated && <Award className="h-4 w-4 flex-shrink-0 text-green-500" />}
          </div>
          <p className="text-sm text-neutral-500">${symbol}</p>
        </div>
        <div className="text-right text-sm font-semibold text-neutral-900 dark:text-white">
          {volume}
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className={`h-full rounded-full ${token.isGraduated ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
        <span>{traders} traders</span>
        <span>{token.isGraduated ? 'Graduated' : `${progress.toFixed(0)}%`}</span>
        <span>Launched {age}</span>
      </div>
      {token.links && (token.links.website || token.links.x || token.links.telegram) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {token.links.website && normalizeUrl(token.links.website) && (
            <a
              href={normalizeUrl(token.links.website)!}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[10px] text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-3 w-3" /> Site
            </a>
          )}
          {token.links.x && normalizeUrl(token.links.x) && (
            <a
              href={normalizeUrl(token.links.x)!}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[10px] text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" /> X
            </a>
          )}
          {token.links.telegram && normalizeUrl(token.links.telegram) && (
            <a
              href={normalizeUrl(token.links.telegram)!}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[10px] text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" /> TG
            </a>
          )}
        </div>
      )}
    </Link>
  );
}

export function LauncherTokenGrid({
  tokens,
  isLoading,
}: {
  tokens: LaunchedTokenFeedItem[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60" />
        ))}
      </div>
    );
  }
  if (tokens.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tokens.map((t) => (
        <LauncherTokenCard key={t.id || t.address || ''} token={t} />
      ))}
    </div>
  );
}
