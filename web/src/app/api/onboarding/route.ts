import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { displayName, age, gender, timezone, goals, persona, answers } = body

    // 1. Update Profile
    const supabase = await supabaseServer()
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        display_name: displayName,
        age: parseInt(age) || null,
        gender,
        timezone,
        onboarding_done: true,
      })
      .eq('id', user.id)

    if (profileError) throw profileError

    // 2. Save AI Memory (Goals)
    if (goals && goals.length > 0) {
      await supabase.from('ai_memory').upsert(
        {
          user_id: user.id,
          memory_key: 'user_goals',
          memory_val: goals.join(', '),
          source: 'onboarding'
        },
        { onConflict: 'user_id,memory_key' }
      )
    }

    // 3. Save AI Memory (Persona)
    if (persona) {
      await supabase.from('ai_memory').upsert(
        {
          user_id: user.id,
          memory_key: 'ai_interaction_style',
          memory_val: persona,
          source: 'onboarding'
        },
        { onConflict: 'user_id,memory_key' }
      )
    }

    // 4. Save AI Memory (Follow-up Answers)
    if (answers && typeof answers === 'object') {
      const memoryEntries = Object.entries(answers).map(([key, val]) => ({
        user_id: user.id,
        memory_key: `onboarding_answer_${key}`,
        memory_val: val as string,
        source: 'onboarding'
      }))

      if (memoryEntries.length > 0) {
        await supabase.from('ai_memory').upsert(memoryEntries, { onConflict: 'user_id,memory_key' })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Onboarding API Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
