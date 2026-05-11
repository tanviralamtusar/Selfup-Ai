import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Supported Models ───────────────────────────
export type AiModel = 'gemma-4-31b-it' | 'gemini-2.5-flash' | 'gemini-2.5-pro'

export interface ModelConfig {
  chat_model: AiModel
  background_model: AiModel
}

// ─── Task-Specific Generation Parameters ────────
export type TaskType =
  | 'chat'
  | 'plan_generation'
  | 'test_generation'
  | 'test_evaluation'
  | 'weekly_summary'
  | 'memory_extraction'
  | 'task_generation';

export interface GenerationParams {
  temperature: number
  topP: number
  maxOutputTokens: number
}

export const TASK_PARAMS: Record<TaskType, GenerationParams> = {
  chat: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
  plan_generation: {
    temperature: 0.4,
    topP: 0.90,
    maxOutputTokens: 8192,
  },
  test_generation: {
    temperature: 0.3,
    topP: 0.85,
    maxOutputTokens: 4096,
  },
  test_evaluation: {
    temperature: 0.2,
    topP: 0.80,
    maxOutputTokens: 1024,
  },
  weekly_summary: {
    temperature: 0.6,
    topP: 0.90,
    maxOutputTokens: 2048,
  },
  memory_extraction: {
    temperature: 0.1,
    topP: 0.80,
    maxOutputTokens: 512,
  },
}

// ─── AiCoin Costs ────────────────────────────────
export const AICOIN_COSTS: Record<string, number> = {
  chat_message: 1,
  auto_schedule_day: 5,
  skill_roadmap_7d: 5,
  skill_roadmap_14d: 8,
  skill_roadmap_30d: 10,
  skill_roadmap_open: 15,
  skill_roadmap_tests: 5, // add-on
  fitness_protocol: 25,
  skills_protocol: 15,
  ad_hoc_test: 2,
  weekly_summary: 0,
  test_evaluation: 0,
  memory_retrieval: 0,
  guild_suggestion: 0,
}

// ─── User Model Config ──────────────────────────
export async function getUserModelConfig(userId: string): Promise<ModelConfig> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('ai_chat_model, ai_background_model')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { chat_model: 'gemma-4-31b-it', background_model: 'gemma-4-31b-it' }
    }

    return {
      chat_model: (profile.ai_chat_model as AiModel) || 'gemma-4-31b-it',
      background_model: (profile.ai_background_model as AiModel) || 'gemma-4-31b-it',
    }
  } catch {
    return { chat_model: 'gemma-4-31b-it', background_model: 'gemma-4-31b-it' }
  }
}

// ─── Coin Pre-flight Check ──────────────────────
export async function checkCoinBalance(
  userId: string,
  requiredCoins: number
): Promise<{ allowed: boolean; balance: number; message?: string }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('ai_coins')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { allowed: false, balance: 0, message: 'Failed to check coin balance.' }
    }

    if (profile.ai_coins < requiredCoins) {
      return {
        allowed: false,
        balance: profile.ai_coins,
        message: `Insufficient AiCoins. Required: ${requiredCoins}. Balance: ${profile.ai_coins}. Earn more by completing tasks.`,
      }
    }

    return { allowed: true, balance: profile.ai_coins }
  } catch {
    return { allowed: false, balance: 0, message: 'Failed to check coin balance.' }
  }
}
