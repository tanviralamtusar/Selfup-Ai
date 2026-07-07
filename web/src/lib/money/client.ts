'use client'
import { supabase } from '@/lib/supabase'

/** Authenticated fetch against the money API. Returns parsed JSON. */
export async function moneyFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session?.access_token ?? ''}`,
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`/api/money${path}`, { ...init, headers })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
  return json as T
}

export const moneyApi = {
  get: <T = any>(path: string) => moneyFetch<T>(path),
  post: <T = any>(path: string, body: unknown) =>
    moneyFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T = any>(path: string, body: unknown) =>
    moneyFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T = any>(path: string) => moneyFetch<T>(path, { method: 'DELETE' }),
}
