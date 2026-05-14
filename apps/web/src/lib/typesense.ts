import Typesense from 'typesense';

export const typesenseClient = new Typesense.Client({
    nodes: [
        {
            host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || 'localhost',
            port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || '8108'),
            protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || 'http',
        },
    ],
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY || 'xyz',
    connectionTimeoutSeconds: 2,
});
