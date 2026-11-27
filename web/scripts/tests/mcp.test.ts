import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { NextRequest } from 'next/server';
import type { McpIdentity } from '../../src/lib/mcp/auth';

process.env.NEXT_PUBLIC_APP_URL = 'https://selfup.example';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key';

test('MCP rejects missing credentials with discoverable OAuth metadata', async () => {
  const { handleMcp } = await import('../../src/lib/mcp/handler');
  const response = await handleMcp(new NextRequest('https://selfup.example/api/mcp', { method: 'POST' }));
  assert.equal(response.status, 401);
  assert.match(response.headers.get('www-authenticate')!, /https:\/\/selfup.example\/\.well-known\/oauth-protected-resource\/api\/mcp/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('MCP rejects unapproved browser origins and permits preflight for its own origin', async () => {
  const { handleMcp } = await import('../../src/lib/mcp/handler');
  assert.equal((await handleMcp(new NextRequest('https://selfup.example/api/mcp', { headers: { origin: 'https://untrusted.example' } }))).status, 403);
  const preflight = await handleMcp(new NextRequest('https://selfup.example/api/mcp', { method: 'OPTIONS', headers: { origin: 'https://selfup.example' } }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://selfup.example');
});

test('verified claims require matching user, issuer, OAuth client and resource audience', async () => {
  const { validMcpClaims } = await import('../../src/lib/mcp/auth');
  const claims = { sub: 'user-a', iss: 'https://project.supabase.co/auth/v1', client_id: 'client-a', aud: ['authenticated', 'https://selfup.example/api/mcp'] };
  assert.equal(validMcpClaims(claims, 'user-a'), true);
  assert.equal(validMcpClaims(claims, 'user-b'), false);
  assert.equal(validMcpClaims({ ...claims, client_id: undefined }, 'user-a'), false);
  assert.equal(validMcpClaims({ ...claims, aud: 'authenticated' }, 'user-a'), false);
  assert.equal(validMcpClaims({ ...claims, aud: 'https://other.example/mcp' }, 'user-a'), false);
  assert.equal(validMcpClaims({ ...claims, iss: 'https://other.supabase.co/auth/v1' }, 'user-a'), false);
});

test('MCP tools discover, paginate with explicit ownership, and reject invalid writes', async () => {
  const { createMcpServer } = await import('../../src/lib/mcp/server');
  const calls: unknown[] = [];
  const query = {
    select: (...args: unknown[]) => { calls.push(['select', ...args]); return query; },
    eq: (...args: unknown[]) => { calls.push(['eq', ...args]); return query; },
    order: () => query,
    range: (start: number, end: number) => { calls.push(['range', start, end]); return Promise.resolve({ data: [{ id: 'task-a' }], count: 1, error: null }); },
  };
  const identity = { user: { id: 'user-a' }, token: 'test-token', db: { from: () => query } } as unknown as McpIdentity;
  const server = createMcpServer(identity);
  const client = new Client({ name: 'test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const list = await client.listTools();
    for (const name of ['create_todo', 'update_habit', 'complete_task', 'create_transaction', 'start_focus', 'finish_focus']) {
      assert.ok(list.tools.some((tool) => tool.name === name), name);
    }
    assert.equal(list.tools.find((tool) => tool.name === 'delete_transaction')?.annotations?.destructiveHint, true);
    const result = await client.callTool({ name: 'list_records', arguments: { collection: 'todos', offset: 20, limit: 10 } });
    assert.ok(!result.isError);
    assert.ok(calls.some((call) => JSON.stringify(call) === JSON.stringify(['eq', 'user_id', 'user-a'])));
    assert.ok(calls.some((call) => JSON.stringify(call) === JSON.stringify(['range', 20, 29])));
    const callsBeforeInvalidInput = calls.length;
    const invalid = await client.callTool({ name: 'create_transaction', arguments: {
      request_id: '00000000-0000-4000-8000-000000000001',
      fields: { type: 'expense', amount: -20, currency: 'USD', occurred_at: '2026-11-27' },
    } });
    assert.equal(invalid.isError, true);
    const oversized = await client.callTool({ name: 'list_records', arguments: { collection: 'todos', limit: 10000 } });
    assert.equal(oversized.isError, true);
    assert.equal(calls.length, callsBeforeInvalidInput);
  } finally { await client.close(); await server.close(); }
});

test('adapter retains authentication and stable operation-specific retry keys', async () => {
  const { invokeApi } = await import('../../src/lib/mcp/api');
  const identity = { token: 'test-token' } as McpIdentity;
  const keys: string[] = [];
  const handler = async (req: NextRequest) => {
    assert.equal(req.headers.get('authorization'), 'Bearer test-token');
    keys.push(req.headers.get('idempotency-key')!);
    return Response.json({ success: true });
  };
  await invokeApi(identity, handler, 'todos', 'POST', { title: 'Test' }, 'request-1');
  await invokeApi(identity, handler, 'todos', 'POST', { title: 'Test' }, 'request-1');
  await invokeApi(identity, handler, 'habits', 'POST', { title: 'Test' }, 'request-1');
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[0], keys[2]);
});

test('foreign account references are rejected before invoking a mutation', async () => {
  const { invokeApi } = await import('../../src/lib/mcp/api');
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: null, error: null }) };
  const identity = { user: { id: 'user-a' }, db: { from: () => query } } as unknown as McpIdentity;
  await assert.rejects(() => invokeApi(identity, async () => { assert.fail('must not mutate'); }, 'money/transactions', 'POST', { account_id: 'foreign-account' }), /Invalid or inaccessible account_id/);
});
