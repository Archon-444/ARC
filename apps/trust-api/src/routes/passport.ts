import type { Request, Response, RequestHandler } from 'express';
import type { Address } from 'viem';

import type { TrustApiConfig } from '../config';
import { PassportSource } from '../sources/passport';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Build the passport route handler.
 *
 * When the W13 on-chain integration env is configured
 * (`ARC_PASSPORT_ADDRESS` + `ARC_ATTESTATION_REGISTRY_ADDRESS` +
 * `ARC_RPC_URL`), the handler consults the deployed contracts via
 * @arc/passport-sdk + @arc/attestation-reader and returns the full
 * { passport, attestations } envelope.
 *
 * When any of those vars is unset (or set to an invalid address),
 * the handler falls back to the W8 placeholder body. Same wire
 * shape; the `notice` names exactly which env vars the operator
 * needs to set. CI + unfunded deployments keep working without
 * the on-chain layer.
 */
export function makePassportHandler(cfg: TrustApiConfig): RequestHandler {
  const source = buildSource(cfg);

  if (source) {
    return async (req: Request, res: Response) => {
      const address = req.params.address ?? '';
      if (!ADDRESS_RE.test(address)) {
        res.status(400).json({ error: 'Invalid address' });
        return;
      }
      const result = await source.getPassportFor(address as Address);
      if (result.status === 'error') {
        res.status(502).json({
          address: result.address,
          status: 'error',
          reason: result.reason,
        });
        return;
      }
      res.status(200).json(result);
    };
  }

  return placeholderHandler;
}

function buildSource(cfg: TrustApiConfig): PassportSource | null {
  if (!cfg.passportAddress || !cfg.attestationRegistryAddress || !cfg.rpcUrl) {
    return null;
  }
  if (
    !ADDRESS_RE.test(cfg.passportAddress) ||
    !ADDRESS_RE.test(cfg.attestationRegistryAddress)
  ) {
    console.warn(
      '[trust-api] ARC_PASSPORT_ADDRESS / ARC_ATTESTATION_REGISTRY_ADDRESS env var(s) are set but not a valid 0x address; falling back to placeholder.'
    );
    return null;
  }
  return new PassportSource({
    passportAddress: cfg.passportAddress as Address,
    attestationRegistryAddress: cfg.attestationRegistryAddress as Address,
    rpcUrl: cfg.rpcUrl,
  });
}

/**
 * Pre-W13 fallback. Unchanged shape from the W8 placeholder; the
 * notice text now names the W13 env vars the operator needs to
 * flip on so a future reader knows exactly what to configure.
 */
export function placeholderHandler(req: Request, res: Response): void {
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
      'ArcPassport read path is not configured on this deployment. Set ARC_PASSPORT_ADDRESS + ARC_ATTESTATION_REGISTRY_ADDRESS + ARC_RPC_URL on the trust-api host to read real on-chain state.',
  });
}

/**
 * Back-compat alias. Earlier callers (paid-mock, etc.) import
 * `passportHandler` directly; this keeps that shape so we do not
 * break the existing smoke-test harness or any other consumer.
 */
export const passportHandler: RequestHandler = placeholderHandler;
