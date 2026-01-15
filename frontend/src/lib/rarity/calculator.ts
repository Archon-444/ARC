/**
 * NFT Rarity Calculator
 *
 * Calculates rarity scores based on trait frequency analysis.
 * Rarity Score = Σ(1 / (Trait Frequency / Collection Size))
 */

export interface Trait {
  trait_type: string;
  value: string;
}

export interface NFTMetadata {
  tokenId: string;
  name?: string;
  image?: string;
  attributes: Trait[];
}

export interface NFTWithRarity extends NFTMetadata {
  rarityScore: number;
  rarityRank: number;
  rarityTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  rarityPercentile: number;
}

export interface TraitRarity {
  trait_type: string;
  value: string;
  count: number;
  frequency: number;
  rarityContribution: number;
}

export class RarityCalculator {
  private traitFrequency = new Map<string, number>();
  private traitTypeCount = new Map<string, number>();
  private collectionSize: number;

  constructor(nfts: NFTMetadata[]) {
    this.collectionSize = nfts.length;
    this.calculateTraitFrequencies(nfts);
  }

  private calculateTraitFrequencies(nfts: NFTMetadata[]): void {
    nfts.forEach((nft) => {
      nft.attributes?.forEach((trait) => {
        const key = this.getTraitKey(trait);
        this.traitFrequency.set(key, (this.traitFrequency.get(key) || 0) + 1);
        this.traitTypeCount.set(
          trait.trait_type,
          (this.traitTypeCount.get(trait.trait_type) || 0) + 1
        );
      });
    });
  }

  public calculateRarity(nfts: NFTMetadata[]): NFTWithRarity[] {
    const nftsWithScores = nfts.map((nft) => {
      const rarityScore = this.calculateNFTRarityScore(nft);
      return {
        ...nft,
        rarityScore,
        rarityRank: 0,
        rarityTier: 'common' as const,
        rarityPercentile: 0,
      };
    });

    const sorted = nftsWithScores.sort((a, b) => b.rarityScore - a.rarityScore);

    sorted.forEach((nft, index) => {
      const rank = index + 1;
      const percentile = (rank / this.collectionSize) * 100;
      nft.rarityRank = rank;
      nft.rarityPercentile = percentile;
      nft.rarityTier = this.getRarityTier(percentile);
    });

    return sorted;
  }

  private calculateNFTRarityScore(nft: NFTMetadata): number {
    if (!nft.attributes || nft.attributes.length === 0) {
      return 0;
    }

    let totalScore = 0;
    nft.attributes.forEach((trait) => {
      const key = this.getTraitKey(trait);
      const frequency = this.traitFrequency.get(key) || 1;
      const traitScore = 1 / (frequency / this.collectionSize);
      totalScore += traitScore;
    });

    const traitCount = nft.attributes.length;
    const avgTraitCount =
      Array.from(this.traitTypeCount.values()).reduce((a, b) => a + b, 0) /
      Math.max(this.traitTypeCount.size, 1);
    const traitCountMultiplier = traitCount > avgTraitCount ? 1.1 : 1.0;

    return totalScore * traitCountMultiplier;
  }

  public getTraitRarity(trait: Trait): TraitRarity {
    const key = this.getTraitKey(trait);
    const count = this.traitFrequency.get(key) || 0;
    const frequency = (count / this.collectionSize) * 100;
    const rarityContribution = count === 0 ? 0 : 1 / (count / this.collectionSize);

    return {
      trait_type: trait.trait_type,
      value: trait.value,
      count,
      frequency,
      rarityContribution,
    };
  }

  private getRarityTier(
    percentile: number
  ): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    if (percentile <= 1) return 'legendary';
    if (percentile <= 5) return 'epic';
    if (percentile <= 15) return 'rare';
    if (percentile <= 40) return 'uncommon';
    return 'common';
  }

  private getTraitKey(trait: Trait): string {
    return `${trait.trait_type}:${trait.value}`;
  }

  public getCollectionStats() {
    return {
      collectionSize: this.collectionSize,
      uniqueTraits: this.traitFrequency.size,
      traitTypes: this.traitTypeCount.size,
    };
  }
}
/**
 * NFT Rarity Calculator
 *
 * Calculates rarity scores based on trait frequency analysis.
 */

export interface Trait {
  trait_type: string;
  value: string;
}

export interface NFTMetadata {
  tokenId: string;
  name?: string;
  image?: string;
  attributes: Trait[];
}

export interface NFTWithRarity extends NFTMetadata {
  rarityScore: number;
  rarityRank: number;
  rarityTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  rarityPercentile: number;
}

export interface TraitRarity {
  trait_type: string;
  value: string;
  count: number;
  frequency: number;
  rarityContribution: number;
}

export class RarityCalculator {
  private traitFrequency = new Map<string, number>();
  private traitTypeCount = new Map<string, number>();
  private collectionSize: number;

  constructor(nfts: NFTMetadata[]) {
    this.collectionSize = nfts.length;
    this.calculateTraitFrequencies(nfts);
  }

  private calculateTraitFrequencies(nfts: NFTMetadata[]): void {
    nfts.forEach((nft) => {
      nft.attributes?.forEach((trait) => {
        const key = this.getTraitKey(trait);
        this.traitFrequency.set(key, (this.traitFrequency.get(key) || 0) + 1);

        this.traitTypeCount.set(
          trait.trait_type,
          (this.traitTypeCount.get(trait.trait_type) || 0) + 1
        );
      });
    });
  }

  public calculateRarity(nfts: NFTMetadata[]): NFTWithRarity[] {
    const nftsWithScores = nfts.map((nft) => {
      const rarityScore = this.calculateNFTRarityScore(nft);

      return {
        ...nft,
        rarityScore,
        rarityRank: 0,
        rarityTier: 'common' as const,
        rarityPercentile: 0,
      };
    });

    const sorted = [...nftsWithScores].sort((a, b) => b.rarityScore - a.rarityScore);

    sorted.forEach((nft, index) => {
      const rank = index + 1;
      const percentile = (rank / this.collectionSize) * 100;

      nft.rarityRank = rank;
      nft.rarityPercentile = percentile;
      nft.rarityTier = this.getRarityTier(percentile);
    });

    return sorted;
  }

  private calculateNFTRarityScore(nft: NFTMetadata): number {
    if (!nft.attributes || nft.attributes.length === 0) {
      return 0;
    }

    let totalScore = 0;

    nft.attributes.forEach((trait) => {
      const key = this.getTraitKey(trait);
      const frequency = this.traitFrequency.get(key) || 1;
      const traitScore = 1 / (frequency / this.collectionSize);
      totalScore += traitScore;
    });

    const traitCount = nft.attributes.length;
    const avgTraitCount =
      Array.from(this.traitTypeCount.values()).reduce((a, b) => a + b, 0) /
      Math.max(this.traitTypeCount.size, 1);
    const traitCountMultiplier = traitCount > avgTraitCount ? 1.1 : 1.0;

    return totalScore * traitCountMultiplier;
  }

  public getTraitRarity(trait: Trait): TraitRarity {
    const key = this.getTraitKey(trait);
    const count = this.traitFrequency.get(key) || 0;
    const frequency = (count / this.collectionSize) * 100;
    const rarityContribution = 1 / (count / this.collectionSize);

    return {
      trait_type: trait.trait_type,
      value: trait.value,
      count,
      frequency,
      rarityContribution,
    };
  }

  private getRarityTier(
    percentile: number
  ): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    if (percentile <= 1) return 'legendary';
    if (percentile <= 5) return 'epic';
    if (percentile <= 15) return 'rare';
    if (percentile <= 40) return 'uncommon';
    return 'common';
  }

  private getTraitKey(trait: Trait): string {
    return `${trait.trait_type}:${trait.value}`;
  }

  public getCollectionStats() {
    return {
      collectionSize: this.collectionSize,
      uniqueTraits: this.traitFrequency.size,
      traitTypes: this.traitTypeCount.size,
    };
  }
}
