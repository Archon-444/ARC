import type { Request, Response } from 'express';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Free passport-lookup endpoint. Returns a placeholder until W8, when
 * ArcPassport.sol ships on Arc testnet and `@arc/passport-sdk` can read
 * real identity data.
 */
export function passportHandler(req: Request, res: Response): void {
  const address = req.params.address ?? '';
  if (!ADDRESS_RE.test(address)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }

  res.status(200).json({
    address: address.toLowerCase(),
    passport: null,
    status: 'not_indexed',
    notice:
      'ARC Passport is scheduled for W8 (ArcPassport.sol on Arc testnet) and W9 (Reputation + AttestationRegistry). This endpoint will return a real on-chain passport at that point.',
  });
}
