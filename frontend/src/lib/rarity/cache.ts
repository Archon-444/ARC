import { kv } from '@vercel/kv';
import { RarityCalculator, NFTMetadata, NFTWithRarity } from './calculator';

const CACHE_TTL = 3600 * 24; // 24 hours
const CACHE_KEY_PREFIX = 'rarity:';

export interface RarityCacheEntry {
  collectionAddress: string;
  calculatedAt: number;
  collectionSize: number;
  rarityData: NFTWithRarity[];
}

export class RarityCache {
  static async get(collectionAddress: string): Promise<NFTWithRarity[] | null> {
    try {
      const key = `${CACHE_KEY_PREFIX}${collectionAddress.toLowerCase()}`;
      const cached = await kv.get<RarityCacheEntry>(key);
      if (!cached) return null;

      const age = Date.now() - cached.calculatedAt;
      if (age > CACHE_TTL * 1000) {
        await this.invalidate(collectionAddress);
        return null;
      }

      return cached.rarityData;
    } catch (error) {
      console.error('Rarity cache GET error:', error);
      return null;
    }
  }

  static async set(collectionAddress: string, rarityData: NFTWithRarity[]): Promise<void> {
    try {
      const key = `${CACHE_KEY_PREFIX}${collectionAddress.toLowerCase()}`;
      const entry: RarityCacheEntry = {
        collectionAddress: collectionAddress.toLowerCase(),
        calculatedAt: Date.now(),
        collectionSize: rarityData.length,
        rarityData,
      };

      await kv.set(key, entry, { ex: CACHE_TTL });
    } catch (error) {
      console.error('Rarity cache SET error:', error);
    }
  }

  static async invalidate(collectionAddress: string): Promise<void> {
    try {
      const key = `${CACHE_KEY_PREFIX}${collectionAddress.toLowerCase()}`;
      await kv.del(key);
    } catch (error) {
      console.error('Rarity cache INVALIDATE error:', error);
    }
  }

  static async calculateAndCache(
    collectionAddress: string,
    nfts: NFTMetadata[]
  ): Promise<NFTWithRarity[]> {
    const calculator = new RarityCalculator(nfts);
    const rarityData = calculator.calculateRarity(nfts);
    await this.set(collectionAddress, rarityData);
    return rarityData;
  }

  static async getOrCalculate(
    collectionAddress: string,
    nfts: NFTMetadata[]
  ): Promise<NFTWithRarity[]> {
    const cached = await this.get(collectionAddress);
    if (cached) return cached;
    return await this.calculateAndCache(collectionAddress, nfts);
  }
}
