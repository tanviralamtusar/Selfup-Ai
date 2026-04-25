import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { generateResponse } from '@/lib/gemma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // 1. Fetch user profile for persona
  const { data: profile } = await db
    .from('user_profiles')
    .select('ai_persona_name, ai_persona_style')
    .eq('id', user.id)
    .single()

  // 2. Fetch AI memory for preferences
  const { data: memories } = await db
    .from('ai_memory')
    .select('content')
    .eq('user_id', user.id)
    .in('category', ['general', 'time_management', 'goals'])

  // 3. Fetch unscheduled tasks
  const { data: tasks } = await db
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'todo')
    .is('scheduled_start', null)

  // 4. Fetch habits
  const { data: habits } = await db
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  // 5. Construct AI Prompt
  const rawPersonaName = profile?.ai_persona_name || 'System'
  const personaName = rawPersonaName === 'Nova' ? 'System' : rawPersonaName

  const prompt = `
    You are ${personaName}, the user's elite AI strategist. 
    Your persona style is: ${profile?.ai_persona_style || 'professional and tactical'}.
    
    User Preferences from Memory:
    ${memories?.map(m => `- ${m.content}`).join('\n') || 'None recorded.'}

    Analyze these tasks and habits and create an optimized daily schedule (6 AM - 11 PM).
    
    TASKS (Priority 1 is highest):
    ${tasks?.map(t => `- [ID: ${t.id}] ${t.title} (${t.estimated_minutes || 30}m, Priority: ${t.priority}, Pillar: ${t.pillar})`).join('\n') || 'None'}
    
    HABITS:
    ${habits?.map(h => `- [ID: ${h.id}] ${h.name} (Pillar: ${h.pillar})`).join('\n') || 'None'}

    Tactical Constraints:
    - Start at 6 AM. End at 11 PM.
    - Deep Work/High priority tasks should be scheduled during the user's likely peak hours (or morning if unknown).
    - Group similar pillars together for momentum (e.g., Fitness in one block).
    - Return ONLY a JSON object:
    {
      "logic": "Briefly explain the tactical reasoning for this schedule (1-2 sentences) in your persona style.",
      "schedule": [
        { "id": "task_uuid", "type": "task", "start": "HH:MM", "end": "HH:MM" },
        { "id": "habit_id", "type": "habit", "start": "HH:MM", "end": "HH:MM" }
      ]
    }
  `

  try {
    const aiResponse = await generateResponse(prompt, [], `You are ${personaName}. Return strictly JSON.`)
    const result = JSON.parse(aiResponse.replace(/```json|```/g, '').trim())

    return NextResponse.json(result)
  } catch (err) {
    console.error('Auto-schedule error:', err)
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
  }
}
