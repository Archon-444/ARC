import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    // Color code by status
    const statusColor =
      res.statusCode >= 500
        ? '\x1b[31m' // Red
        : res.statusCode >= 400
        ? '\x1b[33m' // Yellow
        : res.statusCode >= 300
        ? '\x1b[36m' // Cyan
        : '\x1b[32m'; // Green

    console.log(
      `${statusColor}${req.method}\x1b[0m ${req.path} ${statusColor}${res.statusCode}\x1b[0m ${duration}ms`
    );

    // Log slow requests
    if (duration > 1000) {
      console.warn('⚠️  Slow request:', log);
    }

    // In production, send to logging service (e.g., CloudWatch, DataDog)
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToLoggingService(log);
    }
  });

  next();
}
