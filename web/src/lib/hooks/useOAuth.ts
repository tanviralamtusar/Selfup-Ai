'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decideConsent, followOAuthRedirect, getConsent, listOAuthGrants, oauthGoogleLogin, oauthLogin, revokeOAuthGrant } from '@/lib/mcp/oauth-client';

export function useOAuthConsent(authorizationId: string, userId?: string) {
  return useQuery({ queryKey: ['oauth-consent', userId, authorizationId], queryFn: () => getConsent(authorizationId),
    enabled: !!userId && !!authorizationId, retry: false, refetchOnWindowFocus: false });
}

export function useOAuthDecision(authorizationId: string) {
  return useMutation({ mutationFn: async (approve: boolean) => {
    const data = await decideConsent(authorizationId, approve);
    followOAuthRedirect(data.redirect_url);
  } });
}

export function useOAuthLogin() { return useMutation({ mutationFn: oauthLogin }); }
export function useOAuthGoogleLogin() { return useMutation({ mutationFn: oauthGoogleLogin }); }

export function useOAuthGrants(userId?: string) {
  const client = useQueryClient();
  const grants = useQuery({ queryKey: ['oauth-grants', userId], queryFn: listOAuthGrants, enabled: !!userId, retry: false });
  const revoke = useMutation({ mutationFn: revokeOAuthGrant,
    onSuccess: () => client.invalidateQueries({ queryKey: ['oauth-grants', userId] }) });
  return { grants, revoke };
}
