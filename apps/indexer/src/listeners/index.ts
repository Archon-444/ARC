/**
 * Listener boot entry. Called once from server.ts after the WebSocket
 * server is set up. Each listener is env-gated independently: a
 * deployment that has only the passport address configured will only
 * boot the passport listener.
 */

import { startPassportListenerFromEnv, type PassportListener } from './passport';
import { startAttestationListenerFromEnv, type AttestationListener } from './attestation';

export interface RunningListeners {
  passport: PassportListener | null;
  attestation: AttestationListener | null;
}

export function startListeners(): RunningListeners {
  const passport = startPassportListenerFromEnv();
  const attestation = startAttestationListenerFromEnv();
  if (!passport && !attestation) {
    console.log(
      '[indexer] no contract addresses configured (ARC_PASSPORT_ADDRESS / ARC_ATTESTATION_REGISTRY_ADDRESS); listeners idle',
    );
  }
  return { passport, attestation };
}

export function stopListeners(running: RunningListeners): void {
  running.passport?.stop();
  running.attestation?.stop();
}
