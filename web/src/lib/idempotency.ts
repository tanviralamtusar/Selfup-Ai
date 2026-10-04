import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// A claim left in 'pending' this long belongs to a request that crashed
// mid-way; let the retry take it over instead of blocking forever.
const STALE_CLAIM_MS = 2 * 60 * 1000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** True for a canonical UUID string. Used to accept client-generated ids. */
export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

/** `{ id }` when the client supplied a valid UUID, otherwise `{}` (DB default). */
export function clientId(v: unknown): { id?: string } {
  return isUuid(v) ? { id: v } : {}
}

/**
 * The day an action belongs to (YYYY-MM-DD, same UTC convention as the rest
 * of the API). Offline clients send the day the user actually acted so XP
 * keys and logs land on that day; anything outside the last week, in the
 * future, or malformed falls back to today.
 */
export function actionDate(v: unknown): string {
  const today = new Date().toISOString().split('T')[0]
  if (typeof v !== 'string' || !DATE_RE.test(v)) return today
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  return v >= weekAgo && v <= today ? v : today
}

/** True when a Supabase/Postgres error is a unique violation. */
export function isUniqueViolation(err: { code?: string } | null | undefined): boolean {
  return err?.code === '23505'
}

/**
 * After an insert with a client-supplied id fails on a unique violation,
 * return the row that already exists (a replayed create) so the caller can
 * answer with success instead of an error. Returns null otherwise.
 */
export async function existingOnDuplicate(
  db: SupabaseClient,
  table: string,
  err: { code?: string } | null,
  id: unknown,
  userId: string
): Promise<Record<string, unknown> | null> {
  if (!isUniqueViolation(err) || !isUuid(id)) return null
  const { data } = await db.from(table).select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  return data ?? null
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>

/**
 * Wrap a mutating route handler so a request carrying an `Idempotency-Key`
 * header runs at most once per user.
 *
 * The first request claims the key in `sync_idempotency`, runs, and stores
 * its response. A repeat with the same key gets the stored response (with
 * `Idempotent-Replay: true`) without running the handler again. Server errors
 * release the claim so the client can retry. Requests without the header, or
 * when the table is unavailable, run normally.
 */
export function idempotent<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    const key = req.headers.get('idempotency-key')
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!key || !token || key.length > 128) return handler(req, ctx)

    const db = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const path = new URL(req.url).pathname

    const claim = await db
      .from('sync_idempotency')
      .insert({ key, method: req.method, path })

    if (claim.error) {
      if (!isUniqueViolation(claim.error)) {
        // Table missing, bad token, etc. — don't block the request on it.
        return handler(req, ctx)
      }

      const { data: prior } = await db
        .from('sync_idempotency')
        .select('status, response_status, response_body, created_at')
        .eq('key', key)
        .maybeSingle()

      if (prior?.status === 'done') {
        return NextResponse.json(prior.response_body, {
          status: prior.response_status ?? 200,
          headers: { 'Idempotent-Replay': 'true' },
        })
      }

      const stale = prior && Date.now() - new Date(prior.created_at).getTime() > STALE_CLAIM_MS
      if (!stale) {
        return NextResponse.json(
          { success: false, error: 'Request already in progress', retry: true },
          { status: 503, headers: { 'Retry-After': '2' } }
        )
      }
      // Stale claim: fall through and take it over (the row stays; we update it below).
    }

    let res: Response
    try {
      res = await handler(req, ctx)
    } catch (err) {
      await db.from('sync_idempotency').delete().eq('key', key)
      throw err
    }

    if (res.status >= 500) {
      await db.from('sync_idempotency').delete().eq('key', key)
      return res
    }

    const body = await res.clone().json().catch(() => null)
    await db
      .from('sync_idempotency')
      .update({ status: 'done', response_status: res.status, response_body: body })
      .eq('key', key)

    return res
  }
}
