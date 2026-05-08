import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { generateResponse, buildSystemPrompt } from '@/lib/gemma'
import {
  fetchUserMemory,
  formatMemoryContext,
  extractAndSaveMemory,
  needsRetrieval,
  retrieveRelevantMemories,
  embedAndStoreMessage,
} from '@/lib/ai-memory'
import { parseActions, executeActions } from '@/lib/ai-actions'
import { getUserModelConfig } from '@/lib/model-config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── GET — Fetch conversations or messages ──────

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      const { data: messages, error } = await authSupabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Filter out system notification messages so they don't clutter the user's UI
      const uiMessages = messages.filter((m: any) => !m.metadata?.system_notification)

      return NextResponse.json(uiMessages)
    } else {
      const { data: conversations, error } = await authSupabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return NextResponse.json(conversations)
    }
  } catch (err: any) {
    console.error('[AI Chat Fetch Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// ─── POST — Send a message ──────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Auth
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { content, conversationId, modelName: requestedModel } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // 2. Fetch User Profile for context, coins, persona
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select(`
        id, display_name, level, xp, xp_to_next_level, total_xp,
        ai_coins, hp, max_hp, hp_state, rank,
        streak_overall, streak_best,
        ai_persona_name, ai_persona_style, ai_custom_persona,
        ai_chat_model, ai_background_model,
        timezone, weekly_summary_day, weekly_summary_time
      `)
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    // 3. AiCoin Pre-flight Check
    if (profile.ai_coins < 1) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient AiCoins. Need at least 1 coin per message. Earn more by completing tasks.',
      }, { status: 403 })
    }

    // 4. Manage Conversation
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

    // 5. Build Context Pipeline (all layers in parallel)
    const [
      memoryFacts,
      conversationHistory,
      modelConfig,
    ] = await Promise.all([
      fetchUserMemory(user.id),                                     // Layer 2
      fetchConversationHistory(authSupabase, activeConversationId),  // Layer 1
      getUserModelConfig(user.id),                                  // Model config
    ])

    // Layer 3: RAG retrieval (only if needed)
    let retrievedMemories: string[] = []
    if (needsRetrieval(content)) {
      retrievedMemories = await retrieveRelevantMemories(user.id, content, 5)
      console.log(`[RAG] Retrieved ${retrievedMemories.length} relevant memories`)
    }

    // 6. Format Context Blocks
    const memoryContext = await formatMemoryContext(memoryFacts)
    const liveStateBlock = buildLiveStateBlock(profile)
    const retrievedMemoriesBlock = retrievedMemories.length > 0
      ? retrievedMemories.join('\n')
      : ''

    // 7. Build System Prompt
    const personaName = profile.ai_persona_name || 'SYSTEM'
    const personaStyle = profile.ai_persona_style || 'friendly'
    const customPersona = profile.ai_custom_persona || null

    const systemPrompt = buildSystemPrompt(
      personaName,
      personaStyle,
      customPersona,
      memoryContext,
      liveStateBlock,
      retrievedMemoriesBlock
    )

    // 8. Determine model to use
    const chatModel = requestedModel || modelConfig.chat_model || 'gemma-4-31b-it'

    // 9. Generate Response
    const rawAiResponse = (await generateResponse(
      content,
      conversationHistory as any,
      systemPrompt,
      chatModel,
      'chat'
    )) || ''

    // 10. Parse Actions
    const { cleanText, actions, confirmationActions } = parseActions(rawAiResponse)

    // Execute non-confirmation actions (memory updates, etc.)
    if (actions.length > 0) {
      executeActions(user.id, actions).catch(err =>
        console.error('[AI Action Execution Failed]:', err)
      )
    }

    const aiResponse = cleanText || rawAiResponse

    // 11. Save Messages
    const { data: savedUserMsg, error: saveUserMsgError } = await authSupabase
      .from('ai_messages')
      .insert({
        conversation_id: activeConversationId,
        user_id: user.id,
        role: 'user',
        content,
        coin_cost: 1,
      })
      .select('id')
      .single()

    if (saveUserMsgError) throw saveUserMsgError

    const allActions = [...actions, ...confirmationActions]
    const { data: savedAiMsg, error: saveAiMsgError } = await authSupabase
      .from('ai_messages')
      .insert({
        conversation_id: activeConversationId,
        user_id: user.id,
        role: 'assistant',
        content: aiResponse,
        metadata: allActions.length > 0
          ? { actions: allActions, retrieved_memories: retrievedMemories.length }
          : {},
        coin_cost: 0,
      })
      .select('id')
      .single()

    if (saveAiMsgError) throw saveAiMsgError

    // 12. Update conversation timestamp
    await authSupabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeConversationId)

    // 13. Deduct 1 AiCoin
    await serviceSupabase
      .from('user_profiles')
      .update({ ai_coins: profile.ai_coins - 1 })
      .eq('id', user.id)

    // 14. Post-processing (non-blocking)
    // Queue embedding for both messages into vector store
    if (savedUserMsg?.id && savedAiMsg?.id) {
      Promise.all([
        embedAndStoreMessage(user.id, activeConversationId, savedUserMsg.id, content, 'user'),
        embedAndStoreMessage(user.id, activeConversationId, savedAiMsg.id, aiResponse, 'assistant'),
      ]).catch(err => console.error('[Vector Embed Failed]:', err))
    }

    // AI-driven memory extraction (non-blocking)
    extractAndSaveMemory(user.id, content, aiResponse).catch(err =>
      console.error('[Memory Extraction Failed]:', err)
    )

    // 15. Return Response
    return NextResponse.json({
      success: true,
      data: {
        content: aiResponse,
        conversationId: activeConversationId,
        coinsRemaining: profile.ai_coins - 1,
        metadata: allActions.length > 0 ? { actions: allActions } : undefined,
        confirmationActions: confirmationActions.length > 0 ? confirmationActions : undefined,
      },
    })
  } catch (err: any) {
    console.error('[AI Chat Error]:', err)
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// ─── DELETE — Archive a conversation ────────────

export async function DELETE(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Conversation ID is required' }, { status: 400 })
    }

    // Soft-delete: archive instead of hard delete
    const { error } = await authSupabase
      .from('ai_conversations')
      .update({ is_archived: true })
      .eq('id', conversationId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[AI Chat Delete Error]:', err)
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// ─── Helpers ────────────────────────────────────

async function fetchConversationHistory(supabase: any, conversationId: string) {
  const { data: messages, error } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(20) // Layer 1: last 20 messages

  if (error) throw error

  return (messages?.reverse() || []).map((m: any) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))
}

function buildLiveStateBlock(profile: any): string {
  const userTimezone = profile.timezone || 'UTC'
  const now = new Date()

  let userLocalTime: string
  try {
    userLocalTime = now.toLocaleString('en-US', {
      timeZone: userTimezone,
      dateStyle: 'full',
      timeStyle: 'medium',
    })
  } catch {
    userLocalTime = now.toISOString()
  }

  return `LIVE STATE SNAPSHOT:
- Player: ${profile.display_name || 'Unknown'}
- Level: ${profile.level || 1} | Rank: ${profile.rank || 'E'}
- XP: ${profile.xp || 0} / ${profile.xp_to_next_level || 100}
- HP: ${profile.hp || 100} / ${profile.max_hp || 100} (${profile.hp_state || 'healthy'})
- Active Streak: ${profile.streak_overall || 0} days (Best: ${profile.streak_best || 0})
- AiCoin Balance: ${profile.ai_coins || 0}
- User Local Time: ${userLocalTime} (${userTimezone})
- Weekly Summary: ${profile.weekly_summary_day || 'not set'} at ${profile.weekly_summary_time || 'not set'}`
}
