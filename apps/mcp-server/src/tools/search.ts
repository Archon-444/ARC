import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const arcSearchTool: Tool = {
  name: 'arc_search',
  title: 'ARC Search — placeholder, ships W11',
  description:
    'Search for tokens / addresses with optional minimum trust score. Stub for W6; the real search index ships in W11 (trust surface + legacy quarantine). Always returns an empty result set with a notice.',
  inputSchema: {
    type: 'object',
    required: ['query'],
    properties: {
      query: { type: 'string', minLength: 1, description: 'Free-text query.' },
      min_score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Optional minimum trust score filter (0-100).',
      },
    },
    additionalProperties: false,
  },
};

export async function handleArcSearch(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  let parsed: { query: string; min_score?: number };
  try {
    parsed = parseSearchArgs(args);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: message }], isError: true };
  }
  const { query, min_score } = parsed;
  const body = {
    status: 'not_indexed',
    notice:
      'arc_search is a W6 placeholder. The real index ships in W11 alongside the public trust surface (apps/web /agents + /trust/[target]). Calls return an empty result set until then.',
    query,
    min_score: min_score ?? null,
    results: [] as unknown[],
  };
  return { content: [{ type: 'text', text: JSON.stringify(body, null, 2) }] };
}

function parseSearchArgs(args: unknown): { query: string; min_score?: number } {
  if (!args || typeof args !== 'object') {
    throw new Error('arc_search: arguments must be an object with `query`');
  }
  const a = args as { query?: unknown; min_score?: unknown };
  if (typeof a.query !== 'string' || a.query.length === 0) {
    throw new Error('arc_search: `query` must be a non-empty string');
  }
  let min: number | undefined;
  if (a.min_score !== undefined) {
    if (typeof a.min_score !== 'number' || a.min_score < 0 || a.min_score > 100) {
      throw new Error('arc_search: `min_score` must be a number in [0, 100]');
    }
    min = a.min_score;
  }
  return { query: a.query, min_score: min };
}
