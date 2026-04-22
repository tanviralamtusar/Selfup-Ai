import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { generateResponse, SYSTEM_PROMPT, PERSONA_PROMPTS } from '@/lib/gemma'
import { fetchUserMemory, formatMemoryContext, extractAndSaveMemory } from '@/lib/ai-memory'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Fetch messages for a specific conversation
      const { data: messages, error } = await authSupabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return NextResponse.json(messages)
    } else {
      // Fetch all conversations for the user
      const { data: conversations, error } = await authSupabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return NextResponse.json(conversations)
    }

  } catch (err: any) {
    console.error('[AI Chat Fetch Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Auth
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { content, conversationId } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // 2. Manage Conversation
    let activeConversationId = conversationId
    if (!activeConversationId) {
      const { data: newConv, error: convError } = await authSupabase
        .from('ai_conversations')
        .insert({ user_id: user.id, title: content.substring(0, 50) })
        .select()
        .single()
      
      if (convError) throw convError
      activeConversationId = newConv.id
    }

    // 3. Fetch History (last 10 messages for context)
    const { data: messages, error: msgError } = await authSupabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (msgError) throw msgError

    const history = messages?.reverse().map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })) || []

    // 4. Fetch User Profile for Coins and Stats
    const { data: profile, error: profileError } = await authSupabase
      .from('user_profiles')
      .select('ai_coins, level, xp, display_name, ai_persona_name, ai_persona_style')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    if (profile.ai_coins < 1) {
      return NextResponse.json({ error: 'Insufficient AiCoins. Need at least 1 coin per message.' }, { status: 403 })
    }

    // 5. Fetch User Memory for Cross-Session Context
    const userMemory = await fetchUserMemory(user.id, token!)
    const memoryContext = await formatMemoryContext(userMemory)

    // 6. Build System Prompt with Profile Context + Memory + Persona
    const personaName = profile.ai_persona_name || 'Nova'
    const personaStyle = profile.ai_persona_style || 'friendly'
    const personaTone = PERSONA_PROMPTS[personaStyle] || PERSONA_PROMPTS['friendly']

    const basePrompt = SYSTEM_PROMPT.replaceAll('{{NAME}}', personaName)
    const contextualPrompt = `
${basePrompt}

Persona Context:
- Name: ${personaName}
- Coaching Style: ${personaStyle}
- Instructions: ${personaTone}

User Profile Context:
- Name: ${profile.display_name}
- Level: ${profile.level}
- Current XP: ${profile.xp}

${memoryContext}
`

    // 7. Generate Response
    const aiResponse = await generateResponse(content, history as any, contextualPrompt)

    // 8. Save Messages & Deduct Coin
    const { error: saveUserMsgError } = await authSupabase.from('ai_messages').insert({
      conversation_id: activeConversationId,
      user_id: user.id,
      role: 'user',
      content: content,
      coin_cost: 1
    })
    if (saveUserMsgError) throw saveUserMsgError

    const { error: saveAiMsgError } = await authSupabase.from('ai_messages').insert({
      conversation_id: activeConversationId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse,
      coin_cost: 0
    })
    if (saveAiMsgError) throw saveAiMsgError

    // 9. Extract and Save Memory from Conversation (non-blocking)
    extractAndSaveMemory(user.id, content, aiResponse, token!).catch(err => 
      console.error('[AI Memory Extraction Failed]:', err)
    )

    // 10. Deduct Coin
    const { error: updateProfileError } = await authSupabase
      .from('user_profiles')
      .update({ ai_coins: profile.ai_coins - 1 })
      .eq('id', user.id)
    if (updateProfileError) throw updateProfileError

    return NextResponse.json({ 
      content: aiResponse, 
      conversationId: activeConversationId,
      coinsRemaining: profile.ai_coins - 1
    })

  } catch (err: any) {
    console.error('[AI Chat Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
