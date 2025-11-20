/**
 * ArcMarket Utility Functions
 *
 * Common utilities for formatting, validation, and data manipulation
 */

import { type ClassValue, clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { Address, USDC_DECIMALS } from '@/types';

// ============================================
// CSS Class Utilities
// ============================================

/**
 * Combine class names with clsx
 * Note: For Tailwind class merging, consider using tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ============================================
// USDC Formatting (6 decimals!)
// ============================================

/**
 * Format USDC amount from wei (6 decimals) to human-readable string
 *
 * CRITICAL: Arc uses USDC with 6 decimals, NOT 18!
 *
 * @param amount - Amount in USDC wei (smallest unit)
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted string with USDC symbol
 *
 * @example
 * formatUSDC('1000000') // "1.00 USDC"
 * formatUSDC('1234567') // "1.23 USDC"
 */
export function formatUSDC(amount: string | bigint, decimals: number = 2): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** USDC_DECIMALS);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  // Convert fractional part to decimal string
  const fractionalStr = fractionalPart.toString().padStart(USDC_DECIMALS, '0');
  const decimalValue = parseFloat(`${integerPart}.${fractionalStr}`);

  return `${decimalValue.toFixed(decimals)} USDC`;
}

/**
 * Format USDC amount without symbol
 */
export function formatUSDCValue(amount: string | bigint, decimals: number = 2): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** USDC_DECIMALS);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  const fractionalStr = fractionalPart.toString().padStart(USDC_DECIMALS, '0');
  const decimalValue = parseFloat(`${integerPart}.${fractionalStr}`);

  return decimalValue.toFixed(decimals);
}

/**
 * Parse USDC amount from human-readable string to wei (6 decimals)
 *
 * @param amount - Human-readable amount (e.g., "1.50")
 * @returns Amount in USDC wei (smallest unit)
 *
 * @example
 * parseUSDC('1.50') // 1500000n
 * parseUSDC('0.01') // 10000n
 */
export function parseUSDC(amount: string): bigint {
  if (!amount || amount === '0') return BigInt(0);

  // Remove any commas and trim whitespace
  const cleaned = amount.replace(/,/g, '').trim();

  // Split into integer and decimal parts
  const [integerPart = '0', decimalPart = ''] = cleaned.split('.');

  // Pad or truncate decimal part to USDC_DECIMALS
  const paddedDecimal = decimalPart.padEnd(USDC_DECIMALS, '0').slice(0, USDC_DECIMALS);

  // Combine and convert to BigInt
  const combined = integerPart + paddedDecimal;
  return BigInt(combined);
}

/**
 * Format compact USDC amount (e.g., "1.2K", "3.4M")
 */
export function formatCompactUSDC(amount: string | bigint): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** USDC_DECIMALS);
  const numericValue = Number(value) / Number(divisor);

  if (numericValue >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(1)}M USDC`;
  } else if (numericValue >= 1_000) {
    return `${(numericValue / 1_000).toFixed(1)}K USDC`;
  } else {
    return formatUSDC(value);
  }
}

// ============================================
// Address Formatting
// ============================================

/**
 * Truncate Ethereum address for display
 *
 * @param address - Full Ethereum address
 * @param startLength - Number of characters to show at start (default: 6)
 * @param endLength - Number of characters to show at end (default: 4)
 * @returns Truncated address
 *
 * @example
 * truncateAddress('0x1234567890abcdef1234567890abcdef12345678')
 * // "0x1234...5678"
 */
export function truncateAddress(
  address: Address | string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Check if string is valid Ethereum address
 */
export function isAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// ============================================
// Date/Time Formatting
// ============================================

/**
 * Format Unix timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format Unix timestamp to readable date
 */
export function formatDate(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format Unix timestamp to readable date and time
 */
export function formatDateTime(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get time remaining until timestamp (for auctions)
 */
export function getTimeRemaining(endTime: string | number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const end = typeof endTime === 'string' ? parseInt(endTime) * 1000 : endTime * 1000;
  const now = Date.now();
  const difference = end - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(endTime: string | number): string {
  const { days, hours, minutes, seconds, isExpired } = getTimeRemaining(endTime);

  if (isExpired) return 'Expired';

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// ============================================
// Number Formatting
// ============================================

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number | string): string {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  return value.toLocaleString('en-US');
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers in compact notation (1K, 1M, 1B)
 */
export function formatCompactNumber(num: number | string): string {
  const value = typeof num === 'string' ? parseFloat(num) : num;

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  } else {
    return value.toFixed(0);
  }
}

// ============================================
// Validation
// ============================================

/**
 * Validate USDC amount input
 */
export function isValidUSDCAmount(amount: string): boolean {
  if (!amount || amount === '') return false;

  // Check if valid number format
  const regex = /^\d+(\.\d{1,6})?$/;
  if (!regex.test(amount)) return false;

  // Check if greater than zero
  const value = parseFloat(amount);
  return value > 0;
}

/**
 * Validate token ID
 */
export function isValidTokenId(tokenId: string): boolean {
  return /^\d+$/.test(tokenId);
}

// ============================================
// Image Utilities
// ============================================

/**
 * Get IPFS gateway URL from IPFS URI
 */
export function getIPFSUrl(uri: string): string {
  if (!uri) return '';

  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }

  return uri;
}

/**
 * Get image URL with fallback
 */
export function getImageUrl(uri: string | undefined, fallback: string = '/placeholder-nft.png'): string {
  if (!uri) return fallback;
  return getIPFSUrl(uri);
}

// ============================================
// URL Utilities
// ============================================

/**
 * Build NFT detail URL
 */
export function getNFTUrl(collection: Address, tokenId: string): string {
  return `/nft/${collection}/${tokenId}`;
}

/**
 * Build collection URL
 */
export function getCollectionUrl(collection: Address): string {
  return `/collection/${collection}`;
}

/**
 * Build profile URL
 */
export function getProfileUrl(address: Address): string {
  return `/profile/${address}`;
}

/**
 * Build transaction URL on block explorer
 */
export function getTransactionUrl(txHash: string, chainId: number = 5042002): string {
  if (chainId === 5042002) {
    return `https://testnet.arcscan.app/tx/${txHash}`;
  }
  return `https://arcscan.app/tx/${txHash}`;
}

/**
 * Build address URL on block explorer
 */
export function getAddressUrl(address: Address, chainId: number = 5042002): string {
  if (chainId === 5042002) {
    return `https://testnet.arcscan.app/address/${address}`;
  }
  return `https://arcscan.app/address/${address}`;
}

// ============================================
// Array Utilities
// ============================================

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, index * size + size)
  );
}

/**
 * Get unique values from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// ============================================
// Error Handling
// ============================================

/**
 * Extract user-friendly error message from error object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle common contract revert reasons
    if (error.message.includes('user rejected')) {
      return 'Transaction rejected by user';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient USDC balance';
    }
    if (error.message.includes('allowance')) {
      return 'USDC allowance not approved';
    }
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

// ============================================
// Local Storage Utilities
// ============================================

/**
 * Safely get item from localStorage
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 */
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent fail
  }
}

// ============================================
// Performance Utilities
// ============================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// Browser Utilities
// ============================================

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Get optimized image URL
 */
export function getOptimizedImageUrl(url: string, width?: number): string {
  // Add image optimization parameters for supported providers
  if (url.includes('ipfs.io') && width) {
    return `${url}?w=${width}&auto=format`;
  }
  if (url.includes('cloudinary.com') && width) {
    return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
  }
  return url;
}

// ============================================
// Price Calculation Utilities
// ============================================

/**
 * Calculate price change percentage
 */
export function calculatePriceChange(current: string, previous: string): number {
  const currentNum = Number(current) / 1e6;
  const previousNum = Number(previous) / 1e6;

  if (previousNum === 0) return 0;
  return ((currentNum - previousNum) / previousNum) * 100;
}

/**
 * Calculate royalty amount
 */
export function calculateRoyalty(price: string, royaltyBps: number): string {
  const priceNum = BigInt(price);
  const royalty = (priceNum * BigInt(royaltyBps)) / BigInt(10000);
  return royalty.toString();
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format time ago (compact)
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}
