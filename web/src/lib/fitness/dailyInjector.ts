import { SupabaseClient } from '@supabase/supabase-js'
import { TaskInjectionService } from '@/lib/task-injection.service'
import type { GeneratedPlan, WorkoutPlanRow } from '@/types/fitness'

/**
 * Daily Injector Service
 * Injects workout Dailies and diet Habits when a plan is activated.
 */

export async function injectWorkoutDailies(
  userId: string,
  planId: string,
  plan: GeneratedPlan,
  supabase: SupabaseClient
): Promise<{ injected: number; skipped: number }> {
  const injector = new TaskInjectionService(supabase)
  let injected = 0, skipped = 0

  // Fetch workout_days with their IDs from DB
  const { data: dbDays } = await supabase
    .from('workout_days')
    .select('id, day_number, day_label, rest_day, repeat_day, scheduled_date, scheduled_time')
    .eq('plan_id', planId)
    .order('day_number')

  if (!dbDays) return { injected: 0, skipped: 0 }

  for (const day of dbDays) {
    if (day.rest_day) { skipped++; continue }

    const exerciseCount = plan.workout_days.find(d => d.day_number === day.day_number)?.exercises?.length || 0

    const result = await injector.injectDaily(userId, {
      title: day.day_label || `Workout Day ${day.day_number}`,
      description: `${exerciseCount} exercises · ${plan.plan_meta.session_duration_minutes} min`,
      priority: 'high',
      category: 'fitness',
      source: 'fitness',
      repeat_type: plan.plan_meta.plan_type === 'fixed' ? 'daily' : 'weekly',
      repeat_days: day.repeat_day ? [day.repeat_day] : undefined,
      scheduled_time: day.scheduled_time || undefined,
      expires_on: plan.plan_meta.plan_type === 'fixed' 
        ? (day.scheduled_date || undefined)
        : (plan.plan_meta.duration_days 
            ? new Date(Date.now() + plan.plan_meta.duration_days * 86400000).toISOString().split('T')[0]
            : undefined),
    })

    if (result.injected || result.updated) {
      // Link the daily back to the workout day
      await supabase.from('workout_days').update({ daily_id: result.daily.id }).eq('id', day.id)
      // Link the daily to the plan
      await supabase.from('dailies').update({ plan_id: planId, day_id: day.id }).eq('id', result.daily.id)
      injected++
    } else {
      skipped++
    }
  }

  return { injected, skipped }
}

export async function injectDietHabits(
  userId: string,
  planId: string,
  dietPlan: GeneratedPlan['diet_plan'],
  isOngoing: boolean,
  endDate: string | null,
  supabase: SupabaseClient
): Promise<{ injected: number }> {
  if (!dietPlan) return { injected: 0 }

  const injector = new TaskInjectionService(supabase)
  let injected = 0

  const habitTemplates = [
    { title: 'Log all meals today', hp_penalty: 5 },
    { title: `Hit protein target (${dietPlan.daily_targets.protein_g}g)`, hp_penalty: 5 },
    { title: 'Hit water target (3000ml)', hp_penalty: 5 },
  ]

  for (const template of habitTemplates) {
    const result = await injector.injectHabit(userId, {
      title: template.title,
      category: 'fitness',
      source: 'fitness',
      reset_type: 'daily',
      is_indefinite: isOngoing,
      end_date: endDate || undefined,
    })

    if (result.injected || result.updated) {
      // Link habit to plan
      await supabase.from('habits').update({ plan_id: planId }).eq('id', result.habit.id)
      injected++
    }
  }

  return { injected }
}

/**
 * Remove all injected tasks when a plan is deactivated
 */
export async function cleanupPlanTasks(
  userId: string,
  planId: string,
  supabase: SupabaseClient
): Promise<{ dailies: number; habits: number }> {
  // Mark linked dailies as completed
  const { count: dailiesCount } = await supabase
    .from('dailies')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('plan_id', planId)
    .eq('is_completed', false)

  // Deactivate linked habits (user deletes manually per spec)
  const { count: habitsCount } = await supabase
    .from('habits')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('plan_id', planId)
    .eq('is_active', true)

  return { dailies: dailiesCount || 0, habits: habitsCount || 0 }
}
