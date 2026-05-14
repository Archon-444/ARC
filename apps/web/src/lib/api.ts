const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

export interface OfferData {
  price: bigint;
  expirationDays: number;
}

export async function createOffer(
  nftContract: string,
  tokenId: string,
  offerData: OfferData,
  userToken: string // Circle user token or auth header
) {
  const response = await fetch(`${API_URL}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      nftContract,
      tokenId,
      price: offerData.price.toString(),
      expirationDays: offerData.expirationDays,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create offer');
  }

  return response.json();
}
