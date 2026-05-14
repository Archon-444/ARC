import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { loadConfig, TrustApiConfig } from './config';
import { healthHandler } from './routes/health';
import { makePassportHandler } from './routes/passport';
import { makeAttestationsHandler } from './routes/attestations';
import { makeTrustRoutes } from './routes/trust';
import { makeTrustDeepRoutes } from './routes/trust-deep';
import { requestId } from './middleware/request-id';
import { logger } from './middleware/logger';
import { globalLimiter, paidLimiter } from './middleware/rate-limit';
import { errorHandler } from './middleware/error';

/**
 * trust-api app factory. Wiring order, adopted from apps/indexer/src/server.ts (originally backend/):
 *
 *   request-id → helmet → cors → global rate-limit → body → compression
 *   → logger → routes → 404 → error handler
 *
 * Paid routes additionally pass through `paidLimiter`, keyed off the
 * verified x402 payer when available so a single payer (or anonymous IP)
 * cannot burn facilitator capacity with rapid-fire bad payloads.
 */
export function createApp(cfg: TrustApiConfig = loadConfig()) {
  const app = express();

  app.use(requestId());
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.TRUST_API_CORS_ORIGIN ?? '*',
      credentials: false,
    })
  );
  app.use('/v1/', globalLimiter());
  app.use(express.json({ limit: '64kb' }));
  app.use(compression());
  app.use(logger());

  app.get('/v1/health', healthHandler);
  app.get('/v1/passport/:address', makePassportHandler(cfg));
  app.get('/v1/attestations/:subject', makeAttestationsHandler(cfg));

  const trust = makeTrustRoutes(cfg);
  app.post('/v1/trust/read', paidLimiter(), trust.readPaywall as any, trust.readHandler);

  const deep = makeTrustDeepRoutes(cfg);
  app.post('/v1/trust/read/deep', paidLimiter(), deep.paywall, (req, res, next) => {
    deep.handler(req, res).catch(next);
  });

  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found', path: req.path });
  });

  app.use(errorHandler());

  return app;
}

if (require.main === module) {
  const cfg = loadConfig();
  const app = createApp(cfg);
  app.listen(cfg.port, () => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: '@arc/trust-api',
        msg: 'listening',
        port: cfg.port,
        network: cfg.network,
        facilitator: cfg.facilitatorUrl,
        payTo: cfg.payTo || null,
      })
    );
  });
}
