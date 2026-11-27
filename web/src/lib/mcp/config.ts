import { z } from 'zod';

export function mcpConfig() {
  const app = new URL(z.url().parse(process.env.NEXT_PUBLIC_APP_URL));
  if (app.protocol !== 'https:' && !(app.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(app.hostname))) {
    throw new Error('MCP requires HTTPS (except localhost)');
  }
  const supabase = new URL(z.url().parse(process.env.NEXT_PUBLIC_SUPABASE_URL));
  return {
    origin: app.origin,
    resource: `${app.origin}/api/mcp`,
    metadata: `${app.origin}/.well-known/oauth-protected-resource/api/mcp`,
    issuer: `${supabase.origin}/auth/v1`,
    allowedOrigins: [app.origin, ...(process.env.MCP_ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)],
  };
}
