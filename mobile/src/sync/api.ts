import { API_URL } from '@/lib/env'
import { getAccessToken } from '@/lib/supabase'

export type ApiResult =
  | { kind: 'ok'; status: number; json: any }
  /** Network down, timeout, 5xx, 429 — try again later, keep order. */
  | { kind: 'transient'; status: number; error: string }
  /** Token missing/rejected — stop until the user signs in again. */
  | { kind: 'auth'; status: number; error: string }
  /** The server refused this request for good (4xx). */
  | { kind: 'rejected'; status: number; json: any; error: string }

const TIMEOUT_MS = 15000

/** Call a website /api route as the signed-in user. Never throws. */
export async function apiRequest(
  method: string,
  path: string,
  body?: string | null,
  idempotencyKey?: string
): Promise<ApiResult> {
  const token = await getAccessToken()
  if (!token) return { kind: 'auth', status: 401, error: 'Not signed in' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: body ?? undefined,
      signal: controller.signal,
    })
    const json = await res.json().catch(() => null)
    const error = (json && (json.error as string)) || `HTTP ${res.status}`

    if (res.ok) return { kind: 'ok', status: res.status, json }
    if (res.status === 401) return { kind: 'auth', status: 401, error }
    if (res.status >= 500 || res.status === 429 || res.status === 408) return { kind: 'transient', status: res.status, error }
    return { kind: 'rejected', status: res.status, json, error }
  } catch (e: any) {
    return { kind: 'transient', status: 0, error: e?.name === 'AbortError' ? 'Request timed out' : 'Network unavailable' }
  } finally {
    clearTimeout(timer)
  }
}

export async function apiGet<T = any>(path: string): Promise<T | null> {
  const r = await apiRequest('GET', path)
  return r.kind === 'ok' ? (r.json as T) : null
}
