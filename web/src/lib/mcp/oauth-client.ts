import { z } from 'zod';
import { supabase } from '@/lib/supabase';

export const oauthLoginSchema = z.object({ email: z.email(), password: z.string().min(1, 'Enter your password') });
const authorizationIdSchema = z.string().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/);

export async function getConsent(authorizationId: string) {
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationIdSchema.parse(authorizationId));
  if (error) throw error;
  if (!data) throw new Error('Authorization request was not found');
  return data;
}

export async function decideConsent(authorizationId: string, approve: boolean) {
  const id = authorizationIdSchema.parse(authorizationId);
  const { data, error } = approve
    ? await supabase.auth.oauth.approveAuthorization(id, { skipBrowserRedirect: true })
    : await supabase.auth.oauth.denyAuthorization(id, { skipBrowserRedirect: true });
  if (error) throw error;
  if (!data) throw new Error('Authorization request was not found');
  return data;
}

// Redirects come only from the authenticated authorization server response.
export function followOAuthRedirect(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))) {
    throw new Error('The OAuth callback must use HTTPS or a localhost HTTP address');
  }
  window.location.assign(parsed.href);
}

export async function oauthLogin(input: z.infer<typeof oauthLoginSchema>) {
  const { error } = await supabase.auth.signInWithPassword(oauthLoginSchema.parse(input));
  if (error) throw error;
}

export async function oauthGoogleLogin(authorizationId: string) {
  const id = authorizationIdSchema.parse(authorizationId);
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: {
    redirectTo: `${window.location.origin}/oauth/consent?authorization_id=${encodeURIComponent(id)}`,
  } });
  if (error) throw error;
}

export async function listOAuthGrants() {
  const { data, error } = await supabase.auth.oauth.listGrants();
  if (error) throw error;
  return data ?? [];
}

export async function revokeOAuthGrant(clientId: string) {
  const { error } = await supabase.auth.oauth.revokeGrant({ clientId: z.uuid().parse(clientId) });
  if (error) throw error;
}
