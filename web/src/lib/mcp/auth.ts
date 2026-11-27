import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { mcpConfig } from './config';

export function validMcpClaims(claims: Record<string, unknown>, userId: string) {
  const config = mcpConfig();
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  return claims.sub === userId && claims.iss === config.issuer &&
    typeof claims.client_id === 'string' && !!claims.client_id && audience.includes(config.resource);
}

export async function authenticateMcp(req: NextRequest) {
  const { user } = await verifyAuth(req);
  if (!user) return null;
  const token = req.headers.get('authorization')!.slice(7);
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  // Use verified claims, never decode untrusted JWT payloads for authorization.
  const { data, error } = await db.auth.getClaims(token);
  const claims = data?.claims;
  if (error || !claims || !validMcpClaims(claims, user.id)) return null;
  return { user, token, db };
}

export type McpIdentity = NonNullable<Awaited<ReturnType<typeof authenticateMcp>>>;
