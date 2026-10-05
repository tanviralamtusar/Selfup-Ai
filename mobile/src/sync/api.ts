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
  if (!API_URL) return { kind: 'transient', status: 0, error: 'EXPO_PUBLIC_API_URL was not set when this app was built' }
  const token = await getAccessToken()
  if (!token) return { kind: 'auth', status: 401, error: 'No Supabase session on this phone (not signed in)' }

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
    const error = (json && (json.error as string)) || `HTTP ${res.status} from ${method} ${path}`

    if (res.ok) return { kind: 'ok', status: res.status, json }
    if (res.status === 401) return { kind: 'auth', status: 401, error }
    if (res.status >= 500 || res.status === 429 || res.status === 408) return { kind: 'transient', status: res.status, error }
    return { kind: 'rejected', status: res.status, json, error }
  } catch (e: any) {
    // Keep the platform's message (DNS, TLS, refused…): it's the only clue when this fails on a phone.
    const why = e?.name === 'AbortError' ? `timed out after ${TIMEOUT_MS / 1000}s` : String(e?.message ?? e)
    return { kind: 'transient', status: 0, error: `Can't reach ${API_URL}${path}: ${why}` }
  } finally {
    clearTimeout(timer)
  }
}

export async function apiGet<T = any>(path: string): Promise<T | null> {
  const r = await apiRequest('GET', path)
  return r.kind === 'ok' ? (r.json as T) : null
}
