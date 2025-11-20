import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';

// Routes
import nftRoutes from './routes/nft.routes';
import collectionRoutes from './routes/collection.routes';
import offerRoutes from './routes/offer.routes';
import activityRoutes from './routes/activity.routes';
import searchRoutes from './routes/search.routes';
import analyticsRoutes from './routes/analytics.routes';
import userRoutes from './routes/user.routes';

// WebSocket handlers
import { setupWebSocket } from './websocket';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { logger } from './middleware/logger.middleware';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to API routes
app.use('/v1/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(logger);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/v1/nft', nftRoutes);
app.use('/v1/collection', collectionRoutes);
app.use('/v1/offers', offerRoutes);
app.use('/v1/activity', activityRoutes);
app.use('/v1/search', searchRoutes);
app.use('/v1/analytics', analyticsRoutes);
app.use('/v1/user', userRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`
    🚀 ArcMarket API Server
    ========================
    Environment: ${process.env.NODE_ENV || 'development'}
    Port: ${PORT}
    Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}

    API Endpoints:
    - NFT: http://localhost:${PORT}/v1/nft
    - Collections: http://localhost:${PORT}/v1/collection
    - Offers: http://localhost:${PORT}/v1/offers
    - Activity: http://localhost:${PORT}/v1/activity
    - Search: http://localhost:${PORT}/v1/search
    - Analytics: http://localhost:${PORT}/v1/analytics
    - Users: http://localhost:${PORT}/v1/user

    WebSocket: ws://localhost:${PORT}/ws
    Health Check: http://localhost:${PORT}/health
    ========================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
