import { GraphQLClient } from 'graphql-request';

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/YOUR_ID/arcmarket/version/latest';

export const graphqlClient = new GraphQLClient(SUBGRAPH_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

// Query helpers with error handling
export async function querySubgraph<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T | null> {
  try {
    const data = await graphqlClient.request<T>(query, variables);
    return data;
  } catch (error) {
    console.error('Subgraph query failed:', error);
    return null;
  }
}
