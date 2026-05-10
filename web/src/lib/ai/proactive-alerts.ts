import { SupabaseClient } from '@supabase/supabase-js'
import { generateResponse } from '../gemma'
import { getUserModelConfig } from '../model-config'

interface AlertCheckResult {
  triggeredCount: number
  alerts: string[]
}

export async function runProactiveChecks(
  userId: string,
  supabase: SupabaseClient
): Promise<AlertCheckResult> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) return { triggeredCount: 0, alerts: [] }

  const alerts: string[] = []
  const now = new Date()
  const hour = now.getHours()

  // 1. Streak Danger Check
  const lastDate = profile.streak_last_date
  const todayStr = now.toISOString().split('T')[0]
  if (lastDate !== todayStr && hour >= 20) {
    alerts.push('STREAK_DANGER: No activity logged today. 4 hours remaining to maintain streak.')
  }

  // 2. HP Collapse Check
  if (profile.hp < 20) {
    alerts.push(`HP_COLLAPSE: Vital signs critical (${profile.hp}%). Warning: Death will trigger level regression.`)
  }

  // 3. Skill Stagnation Check
  const { data: lastSession } = await supabase
    .from('skill_sessions')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (lastSession) {
    const lastSessionDate = new Date(lastSession.created_at)
    const diffDays = Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays >= 3) {
      alerts.push(`SKILL_STAGNATION: No study progress detected in ${diffDays} days. Active roadmap synchronization degrading.`)
    }
  }

  // 4. Quest Deadline Check
  const { data: activeQuests } = await supabase
    .from('user_quests')
    .select('id, expires_at, quests(title)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .not('expires_at', 'is', null)

  if (activeQuests) {
    for (const q of activeQuests) {
      const expiry = new Date(q.expires_at!)
      const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)
      if (diffHours > 0 && diffHours < 12) {
        alerts.push(`QUEST_DEADLINE: Time running out for "${(q.quests as any).title}". ${Math.round(diffHours)} hours remaining.`)
      }
    }
  }

  if (alerts.length > 0) {
    await triggerAiAlert(userId, alerts, supabase)
  }

  return {
    triggeredCount: alerts.length,
    alerts
  }
}

async function triggerAiAlert(
  userId: string,
  alerts: string[],
  supabase: SupabaseClient
): Promise<void> {
  const modelConfig = await getUserModelConfig(userId)
  
  const prompt = `You are the System Intelligence. Several critical triggers have been activated for the user.
Triggers:
${alerts.map(a => `- ${a}`).join('\n')}

Task:
Generate a single, punchy, "System Message" alert to show the user. 
It should sound like an AI overseer (concise, cold but supportive, high-stakes).
Do NOT be overly wordy. Max 2 sentences.
Example: "STREAK VULNERABILITY: Energy levels depleted. Log your dailies immediately to prevent vessel stabilization failure."

Output strictly the message text.`

  const message = await generateResponse(
    prompt,
    [],
    undefined,
    modelConfig.background_model,
    'task_generation'
  )

  if (message) {
    // Create a notification for the user
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'ai_alert',
      title: 'SYSTEM ALERT',
      body: message.trim(),
      data: { alerts }
    })
    
    console.log(`[Proactive Alerts] Triggered alert for user ${userId}: ${message.trim()}`)
  }
}
