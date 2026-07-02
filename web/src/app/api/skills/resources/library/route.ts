import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { resolveSkillResource, batchResolveSkillResources } from '@/lib/skills/resourceResolver'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/skills/resources/library?topic=xxx&category=yyy
 * Look up a single resource from the library (with YouTube fallback)
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const topic = url.searchParams.get('topic')
    const category = url.searchParams.get('category') || 'general'
    const query = url.searchParams.get('query') || topic

    if (!topic || !query) {
      return NextResponse.json({ error: 'topic and query are required' }, { status: 400 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const result = await resolveSkillResource(topic, category, query, authSupabase)

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/skills/resources/library
 * Batch resolve resources for multiple topics
 * Body: { queries: [{ topicName, skillCategory, searchQuery }] }
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { queries } = await req.json()
    if (!queries || !Array.isArray(queries)) {
      return NextResponse.json({ error: 'queries array is required' }, { status: 400 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const results = await batchResolveSkillResources(queries, authSupabase)

    // Convert Map to a plain object for JSON serialization
    const resultsObj: Record<string, { url: string; title: string }> = {}
    results.forEach((value, key) => { resultsObj[key] = value })

    return NextResponse.json({ success: true, data: resultsObj })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
