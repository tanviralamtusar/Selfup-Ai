import { SupabaseClient } from '@supabase/supabase-js'
import { generateResponse } from '@/lib/gemma'

/**
 * Adaptation Engine
 * Monitors workout performance and suggests plan adjustments.
 * AI analyzes last 14 days and recommends changes if needed.
 */

interface AnalysisResult {
  needsAdjustment: boolean
  reason?: 'overperforming' | 'underperforming'
  completionRate: number
  suggestion?: Record<string, unknown>
}

export async function analyzePerformance(
  userId: string,
  planId: string,
  supabase: SupabaseClient
): Promise<AnalysisResult> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]

  // Get sessions from last 14 days
  const { data: sessions } = await supabase
    .from('workout_session_logs')
    .select('status, sets_done, logged_date')
    .eq('plan_id', planId)
    .eq('user_id', userId)
    .gte('logged_date', fourteenDaysAgo)

  // Get plan info
  const { data: plan } = await supabase
    .from('workout_plans')
    .select('days_per_week, name, difficulty')
    .eq('id', planId)
    .single()

  if (!plan || !sessions) return { needsAdjustment: false, completionRate: 0 }

  const expectedSessions = (plan.days_per_week || 3) * 2 // 2 weeks
  const completedSessions = sessions.filter(s => s.status === 'complete').length
  const completionRate = expectedSessions > 0 ? (completedSessions / expectedSessions) * 100 : 0

  // Check for adjustment already suggested this week
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data: recentAdj } = await supabase
    .from('plan_adjustments')
    .select('id')
    .eq('plan_id', planId)
    .gte('suggested_at', sevenDaysAgo)
    .limit(1)

  if (recentAdj?.length) return { needsAdjustment: false, completionRate }

  // Overperforming: 100% completion, no partials
  if (completionRate >= 100 && sessions.every(s => s.status === 'complete')) {
    return { needsAdjustment: true, reason: 'overperforming', completionRate }
  }

  // Underperforming: < 60% completion
  if (completionRate < 60 && expectedSessions > 2) {
    return { needsAdjustment: true, reason: 'underperforming', completionRate }
  }

  return { needsAdjustment: false, completionRate }
}

export async function suggestAdjustment(
  userId: string,
  planId: string,
  analysis: AnalysisResult,
  supabase: SupabaseClient
): Promise<string | null> {
  const { data: plan } = await supabase
    .from('workout_plans')
    .select('name, difficulty, days_per_week')
    .eq('id', planId)
    .single()

  if (!plan) return null

  const prompt = `You are analysing a user's fitness protocol performance data.

Plan: ${plan.name}
Difficulty: ${plan.difficulty}
Days/week: ${plan.days_per_week}
Completion rate last 14 days: ${analysis.completionRate.toFixed(0)}%
Reason: ${analysis.reason}

Based on this data, suggest ONE specific adjustment.
Return ONLY valid JSON: {"adjust": true, "reason": "${analysis.reason}", "suggestion": {"change": "description", "details": "specifics"}}
Keep suggestion specific and actionable. One change only.`

  const raw = await generateResponse(prompt)
  if (!raw) return null

  const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
  let parsed
  try { parsed = JSON.parse(clean) } catch { return null }

  if (!parsed.adjust) return null

  const { data: adj, error } = await supabase
    .from('plan_adjustments')
    .insert({
      plan_id: planId,
      user_id: userId,
      reason: analysis.reason,
      suggestion: parsed.suggestion,
      status: 'pending',
    })
    .select()
    .single()

  if (error) { console.error('[Adaptation] Insert failed:', error); return null }
  return adj.id
}

export async function applyAdjustment(
  adjustmentId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase
    .from('plan_adjustments')
    .update({ status: 'approved', resolved_at: new Date().toISOString() })
    .eq('id', adjustmentId)

  return !error
}

export async function ignoreAdjustment(
  adjustmentId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase
    .from('plan_adjustments')
    .update({ status: 'ignored', resolved_at: new Date().toISOString() })
    .eq('id', adjustmentId)

  return !error
}
