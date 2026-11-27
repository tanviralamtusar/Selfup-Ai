import { NextRequest } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { authenticateMcp } from './auth';
import { mcpConfig } from './config';
import { createMcpServer } from './server';

export async function handleMcp(req: NextRequest) {
  try {
    return await handleRequest(req);
  } catch {
    console.error('[MCP] Request could not be processed');
    return Response.json({ error: 'MCP is temporarily unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

async function handleRequest(req: NextRequest) {
  const config = mcpConfig();
  const origin = req.headers.get('origin');
  if (origin && !config.allowedOrigins.includes(origin)) {
    return Response.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin' });
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Expose-Headers', 'WWW-Authenticate, MCP-Protocol-Version');
  if (req.method === 'OPTIONS') {
    headers.set('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, MCP-Protocol-Version, MCP-Session-Id');
    return new Response(null, { status: 204, headers });
  }
  const identity = await authenticateMcp(req);
  if (!identity) {
    headers.set('WWW-Authenticate', `Bearer resource_metadata="${config.metadata}", error="invalid_token"`);
    return Response.json({ error: 'A valid SelfUp OAuth access token is required' }, { status: 401, headers });
  }
  // Stateless Streamable HTTP: no persistent SSE stream or server-side sessions.
  if (req.method !== 'POST') {
    headers.set('Allow', 'POST, OPTIONS');
    return new Response(null, { status: 405, headers });
  }
  // Bound the actual stream, including chunked requests without Content-Length.
  const reader = req.body?.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 256 * 1024) {
        await reader.cancel();
        return Response.json({ error: 'Request too large' }, { status: 413, headers });
      }
      chunks.push(value);
    }
  }
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400, headers });
  }
  const server = createMcpServer(identity);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(req, { parsedBody });
    // Consume JSON before closing the per-request transport.
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: new Headers([...response.headers, ...headers]),
    });
  } finally {
    await server.close();
  }
}
