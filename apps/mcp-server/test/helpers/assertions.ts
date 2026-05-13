/**
 * Shared assertion helpers + the canonical "exercise the three tools"
 * loop used by every inspector spec.
 *
 * Centralizing this means the stdio test, the HTTP test, and the paid-mode
 * test all assert against exactly the same surface — drift in tool wiring
 * surfaces as a failure in every transport, not silently in one.
 */

import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

export function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

export function assertEq<T>(actual: T, expected: T, msg: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg}: expected ${e}, got ${a}`);
}

export function parseText(content: unknown): any {
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error('tool result has no content');
  }
  const first = content[0] as { type?: string; text?: string };
  if (first.type !== 'text' || typeof first.text !== 'string') {
    throw new Error('tool result first content is not text');
  }
  return JSON.parse(first.text);
}

export function log(stage: string, msg: string): void {
  console.log(`  [${stage}] ${msg}`);
}

/**
 * Exercise the three W6 tools against a connected MCP client and assert
 * the five "stub-quote" invariants:
 *
 *   1. listTools order = [arc_trust_read, arc_passport_get, arc_search]
 *   2. arc_passport_get with valid address    -> 200 placeholder
 *   3. arc_passport_get with invalid address  -> isError: true
 *   4. arc_trust_read against unpaid stub     -> payment_required quote
 *   5. arc_search                              -> not_indexed, results=[]
 */
export async function runStubQuoteAssertions(client: Client): Promise<void> {
  // 1. listTools
  const list = await client.listTools();
  const names = list.tools.map((t) => t.name);
  assertEq(names, ['arc_trust_read', 'arc_passport_get', 'arc_search'], 'tool order/names');
  log('listTools', names.join(', '));

  // 2. arc_passport_get — happy path
  const passport = await client.callTool({
    name: 'arc_passport_get',
    arguments: { address: '0x1234567890ABCDEF1234567890ABCDEF12345678' },
  });
  assert(!passport.isError, 'arc_passport_get success path is not an error');
  const passportBody = parseText(passport.content);
  assertEq(passportBody.status, 'not_indexed', 'passport status');
  assertEq(
    passportBody.address,
    '0x1234567890abcdef1234567890abcdef12345678',
    'passport address echoes lowercase'
  );
  log('arc_passport_get', `status=${passportBody.status}`);

  // 3. arc_passport_get — invalid address
  const badPassport = await client.callTool({
    name: 'arc_passport_get',
    arguments: { address: 'not-an-address' },
  });
  assertEq(badPassport.isError, true, 'invalid address is an error');
  log('arc_passport_get invalid', 'isError=true');

  // 4. arc_trust_read — unpaid stub-quote
  const trust = await client.callTool({
    name: 'arc_trust_read',
    arguments: { target: '0x1234567890abcdef1234567890abcdef12345678' },
  });
  assert(!trust.isError, 'unpaid arc_trust_read is not an error');
  const trustBody = parseText(trust.content);
  assertEq(trustBody.status, 'payment_required', 'arc_trust_read status');
  assertEq(
    trustBody.quote.maxAmountRequired,
    '10000',
    'arc_trust_read quote.maxAmountRequired'
  );
  assertEq(trustBody.quote.network, 'base-mainnet', 'arc_trust_read quote.network');
  log(
    'arc_trust_read',
    `payment_required maxAmountRequired=${trustBody.quote.maxAmountRequired}`
  );

  // 5. arc_search — placeholder
  const search = await client.callTool({
    name: 'arc_search',
    arguments: { query: 'usdu', min_score: 50 },
  });
  assert(!search.isError, 'arc_search is not an error');
  const searchBody = parseText(search.content);
  assertEq(searchBody.status, 'not_indexed', 'arc_search status');
  assert(
    Array.isArray(searchBody.results) && searchBody.results.length === 0,
    'arc_search results is []'
  );
  log('arc_search', `not_indexed results=${searchBody.results.length}`);
}
