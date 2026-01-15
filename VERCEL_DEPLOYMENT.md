# ARC NFT Marketplace - Vercel Deployment Guide

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Archon-444/ARC)

## Manual Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from the root directory
```bash
cd /Users/philippeschmitt/Documents/ARC
vercel
```

### 4. Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time)
- Project name? **arc-nft-marketplace** (or your choice)
- In which directory is your code located? **frontend**
- Want to override settings? **N** (The `vercel.json` in `frontend` will be used)

### 5. Production Deployment
```bash
vercel --prod
```

## Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### Required
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Your WalletConnect project ID
- `NEXT_PUBLIC_RPC_URL` - Your RPC endpoint
- `NEXT_PUBLIC_SUBGRAPH_URL` - Goldsky subgraph endpoint

### Optional (for full features)
- `NEXT_PUBLIC_TYPESENSE_HOST` - Typesense server host
- `NEXT_PUBLIC_TYPESENSE_PORT` - Typesense port (default: 443)
- `NEXT_PUBLIC_TYPESENSE_PROTOCOL` - https
- `NEXT_PUBLIC_TYPESENSE_API_KEY` - Typesense search API key
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL (for real-time features)
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (for social features)

## Build Settings in Vercel Dashboard

- **Framework Preset:** Next.js
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 18.x or higher

## Post-Deployment

1. **Custom Domain:** Add your domain in Vercel Dashboard → Settings → Domains
2. **SSL:** Automatically provisioned by Vercel
3. **Analytics:** Enable Vercel Analytics in Settings
4. **Preview Deployments:** Automatic for all branches

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify Node.js version (18+)
- Check build logs in Vercel dashboard

### Missing Features
- Ensure all environment variables are configured
- Mock data will be used if external services aren't configured

### Performance
- Vercel automatically optimizes images
- Edge functions for API routes
- Global CDN for static assets

## Monitoring

- **Vercel Analytics:** Real-time performance metrics
- **Logs:** Available in Vercel Dashboard → Deployments → View Logs
- **Performance:** Lighthouse scores in deployment preview

## CI/CD

Vercel automatically deploys:
- **Production:** Pushes to `main` branch
- **Preview:** Pull requests and other branches

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000
