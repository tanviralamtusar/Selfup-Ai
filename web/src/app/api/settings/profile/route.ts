import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function PATCH(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { display_name, bio, ai_persona_name, ai_persona_style, is_public } = body

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
  if (display_name !== undefined) updateData.display_name = display_name
  if (bio !== undefined) updateData.bio = bio
  if (ai_persona_name !== undefined) updateData.ai_persona_name = ai_persona_name
  if (ai_persona_style !== undefined) updateData.ai_persona_style = ai_persona_style
  if (is_public !== undefined) updateData.is_public = is_public

  const { data, error: dbErr } = await db
    .from('user_profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}
