'use client';

import { Check, Copy, Plug, ShieldCheck } from 'lucide-react';
import { useMcpConnection } from '@/lib/hooks/useMcpConnection';

export function McpConnectionSetup() {
  const { serverUrl, copyStatus, isCopying, copyServerUrl } = useMcpConnection();

  return (
    <section aria-labelledby="mcp-setup-title" className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Plug size={20} aria-hidden="true" /></div>
        <div>
          <h2 id="mcp-setup-title" className="text-lg font-semibold">Connect your AI app</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use SelfUp from an AI app that supports remote MCP servers with OAuth.</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="mcp-server-url" className="text-sm font-medium">MCP server URL</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="mcp-server-url" readOnly value={serverUrl} onFocus={(event) => event.currentTarget.select()}
            placeholder="Loading server URL..." spellCheck={false}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm" />
          <button type="button" disabled={!serverUrl || isCopying} onClick={copyServerUrl}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {copyStatus === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {isCopying ? 'Copying...' : copyStatus === 'copied' ? 'Copied' : 'Copy URL'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Connection type: Streamable HTTP · Authentication: OAuth</p>
        <div aria-live="polite" className="text-sm">
          {copyStatus === 'copied' && <p className="text-primary">Server URL copied. Add it in your AI app.</p>}
          {copyStatus === 'error' && <p role="alert" className="text-destructive">Could not copy automatically. Select the URL above and copy it manually.</p>}
        </div>
      </div>

      <ol className="list-decimal space-y-3 pl-5 text-sm">
        <li>Open your AI app’s integrations or MCP settings and add a remote server named <strong>SelfUp</strong>.</li>
        <li>Paste the server URL above and choose <strong>OAuth</strong> authentication. If asked for client credentials, use those registered for that app.</li>
        <li>Start the connection in your AI app. Sign in to SelfUp, review the requested access, and choose <strong>Allow access</strong>.</li>
      </ol>

      <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 shrink-0" size={17} aria-hidden="true" />
        <p>Connected apps can manage tasks, habits, transactions, and focus time. Only approve apps you trust. You can disconnect them below.</p>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-primary">Connection not working?</summary>
        <p className="mt-2 text-muted-foreground">OAuth must be enabled by the SelfUp administrator before you can connect. If discovery or sign-in fails, ask them to check the server deployment and OAuth configuration. Adding the URL here does not enable OAuth.</p>
      </details>
    </section>
  );
}
