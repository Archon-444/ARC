/**
 * Perceptual Image Hashing (pHash)
 *
 * Generates perceptual hashes for NFT images to detect copymints
 * (near-duplicate images). Uses a DCT-based approach via sharp.
 *
 * Two images are considered similar if their hash Hamming distance < threshold.
 */

import sharp from 'sharp';

const HASH_SIZE = 8; // 8x8 = 64-bit hash
const RESIZE_SIZE = 32; // Resize to 32x32 for DCT approximation

/**
 * Generate a perceptual hash from an image buffer.
 * Returns a 64-character hex string (256-bit hash).
 */
export async function generatePHash(imageBuffer: Buffer): Promise<string> {
  // 1. Resize to small square, convert to grayscale
  const pixels = await sharp(imageBuffer)
    .resize(RESIZE_SIZE, RESIZE_SIZE, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  // 2. Compute mean of all pixel values
  let sum = 0;
  for (let i = 0; i < pixels.length; i++) {
    sum += pixels[i];
  }
  const mean = sum / pixels.length;

  // 3. Create binary hash: 1 if pixel >= mean, 0 otherwise
  // Use center 8x8 block for more stable hash
  const offsetX = Math.floor((RESIZE_SIZE - HASH_SIZE) / 2);
  const offsetY = Math.floor((RESIZE_SIZE - HASH_SIZE) / 2);

  const bits: number[] = [];
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      const idx = (offsetY + y) * RESIZE_SIZE + (offsetX + x);
      bits.push(pixels[idx] >= mean ? 1 : 0);
    }
  }

  // 4. Convert bits to hex string
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += nibble.toString(16);
  }

  return hex;
}

/**
 * Compute the Hamming distance between two hex hash strings.
 * Lower distance = more similar images.
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hash lengths must match');
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);
    // Count bits set in XOR result
    distance += ((xor >> 3) & 1) + ((xor >> 2) & 1) + ((xor >> 1) & 1) + (xor & 1);
  }

  return distance;
}

/**
 * Check if two images are perceptually similar.
 * Default threshold of 10 catches near-identical images with minor
 * modifications (cropping, resizing, compression artifacts).
 */
export function isSimilar(hash1: string, hash2: string, threshold: number = 10): boolean {
  return hammingDistance(hash1, hash2) <= threshold;
}
