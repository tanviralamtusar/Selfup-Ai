'use client';

import { useAuthStore } from '@/store/authStore';
import { useOAuthGrants } from '@/lib/hooks/useOAuth';
import { McpConnectionSetup } from '@/components/mcp/McpConnectionSetup';

export default function ConnectionsPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const { grants, revoke } = useOAuthGrants(userId);
  return <section className="mx-auto max-w-2xl space-y-5 px-3 py-6 sm:p-6">
    <h1 className="text-2xl font-semibold">MCP & connected apps</h1>
    <McpConnectionSetup />
    <h2 className="text-lg font-semibold">Your connected apps</h2>
    <p className="text-sm text-muted-foreground">Manage apps you have allowed to access SelfUp. Disconnecting stops token refresh; an issued access token can remain valid until it expires.</p>
    {grants.isPending && <p role="status">Loading connected apps...</p>}
    {grants.error && <div role="alert"><p>Could not load connected apps. OAuth may still need to be enabled by your administrator.</p><button className="underline" onClick={() => grants.refetch()}>Retry</button></div>}
    {grants.data?.length === 0 && <p>No connected apps.</p>}
    {grants.data?.map((grant) => <article key={grant.client.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
      <div><h2 className="font-medium">{grant.client.name}</h2><p className="break-all text-sm text-muted-foreground">{grant.client.uri}</p></div>
      <button className="rounded-lg border border-border px-3 py-2 disabled:opacity-50" disabled={revoke.isPending} onClick={() => revoke.mutate(grant.client.id)}>Disconnect</button>
    </article>)}
    {revoke.error && <p role="alert" className="text-destructive">{revoke.error.message}</p>}
    {revoke.isSuccess && <p role="status">App disconnected.</p>}
  </section>;
}
