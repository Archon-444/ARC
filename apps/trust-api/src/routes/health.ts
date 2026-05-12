import type { Request, Response } from 'express';

export const startedAt = new Date().toISOString();

export function healthHandler(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    service: '@arc/trust-api',
    startedAt,
    uptimeSec: Math.round(process.uptime()),
  });
}
