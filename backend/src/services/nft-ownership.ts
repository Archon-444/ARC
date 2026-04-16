import { ethers } from 'ethers';

const ERC721_OWNER_OF_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
];

let cachedProvider: ethers.JsonRpcProvider | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (cachedProvider) return cachedProvider;
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    throw new Error('RPC_URL env var is required to verify NFT ownership');
  }
  cachedProvider = new ethers.JsonRpcProvider(rpcUrl);
  return cachedProvider;
}

/**
 * Read the current on-chain owner of an ERC-721 token.
 * Returns lowercased address; throws if the token does not exist.
 */
export async function getNFTOwner(contractAddress: string, tokenId: string): Promise<string> {
  const provider = getProvider();
  const contract = new ethers.Contract(contractAddress, ERC721_OWNER_OF_ABI, provider);
  const owner: string = await contract.ownerOf(tokenId);
  return owner.toLowerCase();
}
