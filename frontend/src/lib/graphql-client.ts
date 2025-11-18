import { GraphQLClient } from 'graphql-request';

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/arcmarket/arcmarket';

export const graphQLClient = new GraphQLClient(SUBGRAPH_URL, {
  headers: {},
});

export async function fetchGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
  try {
    const data = await graphQLClient.request<T>(query, variables);
    return data;
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
}
