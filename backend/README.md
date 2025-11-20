# ArcMarket Backend API

REST API and WebSocket server for ArcMarket NFT Marketplace.

## Features

- ✅ RESTful API with OpenAPI specification
- ✅ Real-time updates via WebSocket
- ✅ Wallet signature authentication
- ✅ Rate limiting and security hardening
- ✅ TypeScript throughout
- ✅ Mock data for rapid development

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (for production)
- Redis (for caching and WebSocket)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev
```

The API will be available at `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code

## API Endpoints

### NFT
- `GET /v1/nft/:id` - Get NFT details
- `GET /v1/nft/:contractAddress/:tokenId/price-history` - Get price history

### Collections
- `GET /v1/collection/:slug` - Get collection details
- `GET /v1/collection/:slug/nfts` - Get NFTs in collection
- `GET /v1/collection/:slug/stats` - Get collection statistics

### Offers
- `POST /v1/offers` - Create new offer (requires auth)
- `GET /v1/nft/:id/offers` - Get offers for NFT
- `POST /v1/offers/:offerId/accept` - Accept offer (requires auth)
- `POST /v1/offers/:offerId/cancel` - Cancel offer (requires auth)

### Activity
- `GET /v1/activity` - Get activity feed

### Search
- `POST /v1/search/autocomplete` - Search autocomplete

### Analytics
- `GET /v1/analytics/volume` - Get volume data
- `GET /v1/analytics/sales-distribution` - Get sales distribution
- `GET /v1/analytics/holder-stats` - Get holder statistics
- `GET /v1/analytics/top-sales` - Get top sales

### Users
- `GET /v1/user/:address` - Get user profile

## WebSocket

Connect to `ws://localhost:3001/ws`

### Room Patterns

- `/ws/activity/nft/:nftId` - NFT activity feed
- `/ws/activity/collection/:collectionId` - Collection activity feed
- `/ws/offers/nft/:nftId` - NFT offer updates

### Events

**Client -> Server:**
```json
{ "type": "subscribe", "room": "nft:abc123" }
{ "type": "unsubscribe", "room": "nft:abc123" }
{ "type": "ping" }
```

**Server -> Client:**
```json
{ "type": "offer_created", "data": {...}, "room": "nft:abc123", "timestamp": 1234567890 }
{ "type": "offer_accepted", "data": {...}, "room": "nft:abc123", "timestamp": 1234567890 }
{ "type": "offer_cancelled", "data": {...}, "room": "nft:abc123", "timestamp": 1234567890 }
```

## Authentication

Endpoints marked "requires auth" need wallet signature authentication.

### Headers

```
X-Wallet-Address: 0x1234...
X-Wallet-Signature: 0xabcd...
X-Wallet-Message: Sign this message to authenticate with ArcMarket. Timestamp: 1234567890
```

### Creating a Signature (Frontend)

```typescript
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();

const message = `Sign this message to authenticate with ArcMarket. Timestamp: ${Date.now()}`;
const signature = await signer.signMessage(message);

// Include in request headers
headers: {
  'X-Wallet-Address': address,
  'X-Wallet-Signature': signature,
  'X-Wallet-Message': message,
}
```

## Database

### Current: In-Memory Storage

For rapid development, the backend uses in-memory storage. Data is lost on restart.

### Future: PostgreSQL + Prisma

To migrate to PostgreSQL:

1. Install Prisma:
   ```bash
   npm install @prisma/client
   npm install -D prisma
   ```

2. Initialize Prisma:
   ```bash
   npx prisma init
   ```

3. Create schema in `prisma/schema.prisma`

4. Run migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Replace in-memory stores in `src/services/*.service.ts` with Prisma queries

## Error Handling

The API uses consistent error responses:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `UNAUTHORIZED` - Missing or invalid authentication
- `NOT_FOUND` - Resource not found
- `FORBIDDEN` - Not authorized to perform action
- `INTERNAL_ERROR` - Server error

## Rate Limiting

Default: 100 requests per 15 minutes per IP

Configure in `.env`:
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security

- ✅ Helmet.js for HTTP security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Wallet signature verification
- ✅ Message timestamp validation (prevents replay attacks)
- ✅ Input validation with Joi

## Deployment

### Docker

```bash
# Build image
docker build -t arcmarket-backend .

# Run container
docker run -p 3001:3001 --env-file .env arcmarket-backend
```

### PM2 (Node.js)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "arcmarket-api" -- start

# Save PM2 config
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

### Vercel/Railway/Render

1. Connect GitHub repository
2. Set environment variables from `.env.example`
3. Deploy

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T12:00:00.000Z",
  "uptime": 12345
}
```

### WebSocket Stats

Connect to server and check logs for connection statistics.

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update API spec (`api-spec.yaml`) for new endpoints
4. Run linter before commit: `npm run lint`

## License

MIT
