import { createClient } from '@supabase/supabase-js'
import { generateResponse, generateEmbedding } from './gemma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

// ═══════════════════════════════════════════════════
// LAYER 2 — Key-Value Fact Store
// ═══════════════════════════════════════════════════

export async function fetchUserMemory(userId: string): Promise<Record<string, string>> {
  try {
    const supabase = getServiceClient()
    const { data: memories, error } = await supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const memoryMap: Record<string, string> = {}
    memories?.forEach((m: any) => {
      const key = m.memory_key || m.key
      const val = m.memory_val || m.value || m.memory_value
      if (key && val) {
        memoryMap[key] = val
      }
    })

    console.log(`[AI Memory] Fetched ${Object.keys(memoryMap).length} memory entries for user ${userId}`)
    return memoryMap
  } catch (err) {
    console.error('[AI Memory Fetch Error]:', err)
    return {}
  }
}

/**
 * Formats the key-value memory facts into a structured prompt block.
 */
export async function formatMemoryContext(memory: Record<string, string>): Promise<string> {
  if (Object.keys(memory).length === 0) return ''

  const sections: string[] = []

  // Group by known categories
  const categories: Record<string, string[]> = {
    'Fitness': ['fitness_goal', 'current_weight', 'height', 'age', 'injuries', 'preferred_gym_time', 'equipment', 'diet_restrictions', 'bmr', 'tdee', 'workout_frequency', 'fitness_level'],
    'Skills & Learning': ['active_learning_focus', 'learning_style', 'skill_roadmaps_active', 'coding_language', 'experience_level', 'active_skills'],
    'Lifestyle': ['sleep_schedule', 'work_hours', 'dietary_restrictions', 'budget_bdt', 'timezone', 'work_environment'],
    'Goals': ['primary_goal', 'target_date', 'weekly_summary_day', 'weekly_summary_time'],
    'Personality': ['ai_persona_name', 'ai_persona_style', 'ai_custom_persona', 'preferred_language', 'communication_style', 'motivation_type'],
  }

  const categorizedKeys = new Set<string>()

  for (const [categoryName, keys] of Object.entries(categories)) {
    const entries = keys
      .filter(k => memory[k])
      .map(k => {
        categorizedKeys.add(k)
        return `- ${k.replace(/_/g, ' ')}: ${memory[k]}`
      })

    if (entries.length > 0) {
      sections.push(`${categoryName}:\n${entries.join('\n')}`)
    }
  }

  // Catch-all for uncategorized entries
  const uncategorized = Object.entries(memory)
    .filter(([key]) => !categorizedKeys.has(key))
    .map(([key, val]) => `- ${key.replace(/_/g, ' ')}: ${val}`)

  if (uncategorized.length > 0) {
    sections.push(`Other:\n${uncategorized.join('\n')}`)
  }

  return sections.join('\n\n')
}

// ═══════════════════════════════════════════════════
// LAYER 3 — Vector Store (RAG)
// ═══════════════════════════════════════════════════

/**
 * Retrieval signals — the AI runs vector search only when these are detected.
 */
const RETRIEVAL_SIGNALS = [
  'you told me', 'i told you', 'remember when', 'last time',
  'before', 'previously', 'earlier', 'we discussed', 'you said',
  'what did i say about', 'what was my', 'recall', 'you mentioned',
  'as i mentioned', 'that time', 'we talked about',
]

export function needsRetrieval(message: string): boolean {
  const lower = message.toLowerCase()
  return RETRIEVAL_SIGNALS.some(signal => lower.includes(signal))
}

/**
 * Embed a message and store it in the vector store.
 */
export async function embedAndStoreMessage(
  userId: string,
  conversationId: string,
  messageId: string,
  content: string,
  role: 'user' | 'assistant'
): Promise<void> {
  try {
    // Skip very short messages
    if (content.length < 20) return

    const embedding = await generateEmbedding(content, 'RETRIEVAL_DOCUMENT')
    if (!embedding || embedding.length === 0) {
      console.warn('[Vector Store] Empty embedding, skipping store')
      return
    }

    const supabase = getServiceClient()
    const { error } = await supabase.from('ai_memory_vectors').insert({
      user_id: userId,
      conversation_id: conversationId,
      message_id: messageId,
      role,
      content_chunk: content.substring(0, 2000), // cap chunk size
      embedding: JSON.stringify(embedding),
    })

    if (error) {
      console.error('[Vector Store] Insert error:', error)
    } else {
      console.log(`[Vector Store] Stored embedding for ${role} message`)
    }
  } catch (err) {
    console.error('[Vector Store] embedAndStoreMessage error:', err)
  }
}

/**
 * Retrieve relevant past memories using cosine similarity search.
 */
export async function retrieveRelevantMemories(
  userId: string,
  currentMessage: string,
  topK: number = 5
): Promise<string[]> {
  try {
    const queryEmbedding = await generateEmbedding(currentMessage, 'RETRIEVAL_QUERY')
    if (!queryEmbedding || queryEmbedding.length === 0) return []

    const supabase = getServiceClient()

    // Use the match_memory_vectors RPC function
    const { data: results, error } = await supabase.rpc('match_memory_vectors', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_user_id: userId,
      match_threshold: 0.75,
      match_count: topK,
    })

    if (error) {
      console.error('[Vector Store] Retrieval error:', error)
      return []
    }

    if (!results || results.length === 0) return []

    console.log(`[Vector Store] Retrieved ${results.length} relevant memories`)
    return results.map((r: any) => {
      const date = new Date(r.created_at).toLocaleDateString()
      return `[${r.role} — ${date}]: ${r.content_chunk}`
    })
  } catch (err) {
    console.error('[Vector Store] retrieveRelevantMemories error:', err)
    return []
  }
}

// ═══════════════════════════════════════════════════
// MEMORY EXTRACTION — AI-Driven (v3)
// ═══════════════════════════════════════════════════

/**
 * AI-driven memory extraction — runs after every AI response.
 * Uses the model to identify new facts from the conversation.
 */
export async function extractAndSaveMemory(
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<void> {
  try {
    const existingMemory = await fetchUserMemory(userId)
    const existingFacts = Object.entries(existingMemory)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')

    const extractionPrompt = `Extract any new user facts from this conversation exchange.
Return ONLY a valid JSON array of {"key": "snake_case_key", "value": "value", "category": "fitness|skills|gamification|personality|lifestyle|goals"} objects.
If no new facts, return [].
Do not repeat facts already in the user profile below.

Known categories and example keys:
- fitness: fitness_goal, current_weight, height, injuries, equipment, preferred_gym_time
- skills: active_learning_focus, learning_style, coding_language, experience_level
- lifestyle: sleep_schedule, work_hours, dietary_restrictions, budget_bdt
- goals: primary_goal, target_date
- personality: communication_style, motivation_type

User Profile (existing):
${existingFacts || 'No existing facts.'}

User message: ${userMessage}
AI response: ${aiResponse.substring(0, 500)}`

    const rawResult = await generateResponse(
      extractionPrompt,
      [],
      'You are a fact extraction system. Only output valid JSON arrays. No markdown, no explanation.',
      'gemma-4-31b-it',
      'memory_extraction'
    )

    if (!rawResult) return

    const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim()
    let facts: Array<{ key: string; value: string; category?: string }> = []

    try {
      facts = JSON.parse(cleanJson)
    } catch {
      console.warn('[Memory Extraction] Failed to parse extraction result:', cleanJson.substring(0, 200))
      return
    }

    if (!Array.isArray(facts) || facts.length === 0) return

    const supabase = getServiceClient()
    for (const fact of facts) {
      if (!fact.key || !fact.value) continue

      await supabase.from('ai_memory').upsert(
        {
          user_id: userId,
          memory_key: fact.key,
          memory_val: fact.value,
          category: fact.category || null,
          confidence: 0.8,
          source: 'chat',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,memory_key' }
      )
    }

    console.log(`[Memory Extraction] Extracted and saved ${facts.length} facts for user ${userId}`)
  } catch (err) {
    console.error('[Memory Extraction Error]:', err)
    // Non-critical — don't throw
  }
}

// ═══════════════════════════════════════════════════
// Direct Memory Operations
// ═══════════════════════════════════════════════════

export async function saveMemory(
  userId: string,
  memoryKey: string,
  memoryValue: string,
  source: string = 'system',
  category?: string
): Promise<void> {
  try {
    const supabase = getServiceClient()
    await supabase.from('ai_memory').upsert(
      {
        user_id: userId,
        memory_key: memoryKey,
        memory_val: memoryValue,
        category: category || null,
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,memory_key' }
    )
    console.log(`[AI Memory] Saved memory: ${memoryKey}`)
  } catch (err) {
    console.error('[AI Memory Save Error]:', err)
    throw err
  }
}

export async function clearUserMemory(userId: string): Promise<void> {
  try {
    const supabase = getServiceClient()
    const { error } = await supabase.from('ai_memory').delete().eq('user_id', userId)
    if (error) throw error
    console.log(`[AI Memory] Cleared all memory for user ${userId}`)
  } catch (err) {
    console.error('[AI Memory Clear Error]:', err)
    throw err
  }
}
