import express from 'express';
import { loadConfig } from './config';
import { healthHandler } from './routes/health';
import { passportHandler } from './routes/passport';
import { makeTrustRoutes } from './routes/trust';

export function createApp(cfg = loadConfig()) {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/v1/health', healthHandler);
  app.get('/v1/passport/:address', passportHandler);

  const trust = makeTrustRoutes(cfg);
  app.post('/v1/trust/read', trust.readPaywall as any, trust.readHandler);

  return app;
}

if (require.main === module) {
  const cfg = loadConfig();
  const app = createApp(cfg);
  app.listen(cfg.port, () => {
    console.log(
      `[trust-api] listening on :${cfg.port} ` +
        `network=${cfg.network} facilitator=${cfg.facilitatorUrl} payTo=${cfg.payTo || '(unset)'}`
    );
  });
}
