import { mcpConfig } from '@/lib/mcp/config';

export const dynamic = 'force-dynamic';

export function GET() {
  const config = mcpConfig();
  return Response.json({
    resource: config.resource,
    resource_name: 'SelfUp',
    authorization_servers: [config.issuer],
    bearer_methods_supported: ['header'],
  }, { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
}
