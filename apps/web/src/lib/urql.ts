import { Client, cacheExchange, fetchExchange } from 'urql';

export const client = new Client({
    url: process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.goldsky.com/api/public/project_xyz/subgraphs/arc-marketplace/v1/gn',
    exchanges: [cacheExchange, fetchExchange],
});
