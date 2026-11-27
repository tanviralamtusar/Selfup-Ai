'use client';

import { useState, useSyncExternalStore } from 'react';

const subscribe = () => () => {};

function configuredUrl() {
  try {
    const app = new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() ?? '');
    return `${app.origin}/api/mcp`;
  } catch {
    return '';
  }
}

export function useMcpConnection() {
  const serverUrl = useSyncExternalStore(subscribe,
    () => configuredUrl() || `${window.location.origin}/api/mcp`, configuredUrl);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isCopying, setIsCopying] = useState(false);

  async function copyServerUrl() {
    if (!serverUrl || isCopying) return;
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(serverUrl);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    } finally {
      setIsCopying(false);
    }
  }

  return { serverUrl, copyStatus, isCopying, copyServerUrl };
}
