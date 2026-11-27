'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { useOAuthConsent, useOAuthDecision, useOAuthGoogleLogin, useOAuthLogin } from '@/lib/hooks/useOAuth';
import { followOAuthRedirect, oauthLoginSchema } from '@/lib/mcp/oauth-client';

const button = 'rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50';

export function OAuthConsent() {
  const authorizationId = useSearchParams().get('authorization_id') ?? '';
  const user = useAuthStore((s) => s.user);
  const consent = useOAuthConsent(authorizationId, user?.id);
  const decision = useOAuthDecision(authorizationId);
  const login = useOAuthLogin();
  const google = useOAuthGoogleLogin();
  const form = useForm<z.infer<typeof oauthLoginSchema>>({ resolver: zodResolver(oauthLoginSchema), mode: 'onBlur' });
  useEffect(() => {
    if (consent.data && 'redirect_url' in consent.data) {
      try { followOAuthRedirect(consent.data.redirect_url); } catch { /* Render a safe error below. */ }
    }
  }, [consent.data]);
  const details = consent.data && 'client' in consent.data ? consent.data : null;
  const error = consent.error ?? decision.error ?? login.error ?? google.error;

  return (
    <main className="min-h-screen bg-background px-5 py-16 text-foreground">
      <section className="mx-auto max-w-lg space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">SelfUp · Connected apps</p>
        <h1 className="text-2xl font-semibold">Connect to SelfUp</h1>
        {!authorizationId ? <p role="alert">Missing authorization request. Start the connection from your AI app.</p> : !user ? (
          <>
            <p className="text-muted-foreground">Sign in to review this connection request.</p>
            <form onSubmit={form.handleSubmit((data) => login.mutate(data))} className="space-y-4">
              <div><label htmlFor="oauth-email">Email</label><input id="oauth-email" type="email" autoComplete="email" {...form.register('email')} className="mt-1 w-full rounded-lg border border-border bg-background p-2" />
                {form.formState.errors.email && <p role="alert">{form.formState.errors.email.message}</p>}</div>
              <div><label htmlFor="oauth-password">Password</label><input id="oauth-password" type="password" autoComplete="current-password" {...form.register('password')} className="mt-1 w-full rounded-lg border border-border bg-background p-2" />
                {form.formState.errors.password && <p role="alert">{form.formState.errors.password.message}</p>}</div>
              <button className={button} disabled={login.isPending} type="submit">{login.isPending ? 'Signing in...' : 'Sign in'}</button>
            </form>
            <button className="rounded-lg border border-border px-4 py-2" disabled={google.isPending} onClick={() => google.mutate(authorizationId)}>Continue with Google</button>
          </>
        ) : details ? (
          <>
            <p><strong>{details.client.name}</strong> wants access to your SelfUp account.</p>
            <p className="break-all text-sm text-muted-foreground">Signed in as {user.email}<br />Return address: {details.redirect_uri}</p>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>Read, create, edit, complete and delete tasks, dailies and habits.</li>
              <li>Read financial records and balances; create, edit and delete transactions.</li>
              <li>Schedule tasks and start, complete or cancel focus sessions.</li>
            </ul>
            <p className="text-sm text-muted-foreground">This connection receives a token for your account. Your existing database permissions also apply outside these MCP tools. Approve only apps you trust with your SelfUp data.</p>
            <p className="text-sm">Requested identity scopes: {details.scope || 'None'}</p>
            <div className="flex gap-3">
              <button className={button} disabled={decision.isPending} onClick={() => decision.mutate(true)}>Allow access</button>
              <button className="rounded-lg border border-border px-4 py-2 disabled:opacity-50" disabled={decision.isPending} onClick={() => decision.mutate(false)}>Deny</button>
            </div>
          </>
        ) : consent.isPending ? <p role="status">Loading request...</p> : consent.data ? <p role="status">Returning to your app. If you are not redirected, check that its callback uses HTTPS or localhost.</p> : null}
        {error && <p role="alert" className="text-destructive">{error.message}</p>}
        {consent.isError && <button className="underline" onClick={() => consent.refetch()}>Retry</button>}
        <Link className="block text-sm text-primary underline" href="/settings/connections">Manage connected apps</Link>
      </section>
    </main>
  );
}
