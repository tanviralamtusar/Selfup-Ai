import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { generateResponse } from '@/lib/gemma'
import { fetchUserMemory, formatMemoryContext } from '@/lib/ai-memory'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // 1. Fetch User Context
    const userMemory = await fetchUserMemory(user.id, token!)
    const memoryContext = await formatMemoryContext(userMemory)

    const { data: profile } = await authSupabase
      .from('user_profiles')
      .select('ai_persona_name, ai_persona_style')
      .eq('id', user.id)
      .single()

    const { data: existingHabits } = await authSupabase
      .from('habits')
      .select('name, pillar')
      .eq('user_id', user.id)

    // 2. Build Suggestion Prompt
    const rawPersonaName = profile?.ai_persona_name || 'System'
    const personaName = rawPersonaName === 'Nova' ? 'System' : rawPersonaName
    
    const systemPrompt = `
      You are "${personaName}", a high-performance AI coach.
      Your task is to suggest 3 highly relevant, high-impact habits (imperatives) for the user.
      
      User Memory/Context:
      ${memoryContext}
      
      Existing Habits:
      ${existingHabits?.map(h => `- ${h.name} (${h.pillar})`).join('\n')}
      
      Rules:
      1. Suggest EXACTLY 3 habits.
      2. Align them with the 4 SelfUp pillars: fitness, skills, time, style, or general.
      3. Return ONLY a JSON array of objects with this structure:
         [
           {
             "name": "Habit Name",
             "description": "Short compelling reason why",
             "pillar": "pillar_name",
             "frequency": "daily",
             "frequency_days": [1,2,3,4,5,6,7],
             "reminder_time": "08:00"
           }
         ]
      4. Do not include any markdown formatting, backticks, or extra text. Just the raw JSON array.
    `

    const aiResponse = await generateResponse("Suggest 3 impactful habits based on my profile.", [], systemPrompt)
    
    // Clean up potential markdown formatting if the model ignored instructions
    const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim()
    const suggestions = JSON.parse(jsonStr)

    return NextResponse.json(suggestions)

  } catch (err: any) {
    console.error('[AI Habit Suggest Error]:', err)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
