import { SupabaseClient } from '@supabase/supabase-js'
import { TaskInjectionService } from '@/lib/task-injection.service'
import type { GeneratedRoadmap } from '@/types/skills'

export async function injectSkillDailies(
  userId: string,
  roadmapId: string,
  roadmap: GeneratedRoadmap,
  weeklyStudyDays: string[],
  scheduledTime: string | null,
  supabase: SupabaseClient
): Promise<{ injected: number; skipped: number }> {
  const injector = new TaskInjectionService(supabase)
  let injected = 0, skipped = 0

  // Create skill_study_days entries based on the roadmap's estimated weeks
  // Let's calculate total days needed.
  // We'll just create a fixed number of study days based on the weekly study days and estimated weeks
  const totalStudyDays = roadmap.estimated_weeks * weeklyStudyDays.length;
  
  if (totalStudyDays === 0) return { injected: 0, skipped: 0 };
  
  // Create study days in DB
  const studyDayEntries = Array.from({ length: totalStudyDays }).map((_, index) => {
      const dayOfWeekStr = weeklyStudyDays[index % weeklyStudyDays.length];

      return {
          roadmap_id: roadmapId,
          day_number: index + 1,
          day_label: `Study Session ${index + 1}`,
          estimated_minutes: roadmap.daily_study_minutes,
          repeat_day: dayOfWeekStr,
          has_test: false,
          is_completed: false,
          is_missed: false,
          scheduled_time: scheduledTime
      }
  });

  const { data: insertedDays, error: daysError } = await supabase
    .from('skill_study_days')
    .insert(studyDayEntries)
    .select('id, day_number, day_label, scheduled_time')

  if (daysError || !insertedDays) {
      console.error('[Skills Injector] Failed to insert study days', daysError);
      return { injected: 0, skipped: 0 };
  }

  // Inject each day into dailies
  for (const [index, day] of insertedDays.entries()) {
    const dayOfWeekStr = weeklyStudyDays[index % weeklyStudyDays.length];
    
    const result = await injector.injectDaily(userId, {
      title: `${roadmap.title}: ${day.day_label}`,
      description: `Study Session · ${roadmap.daily_study_minutes} min`,
      priority: 'high',
      category: 'skills',
      source: 'skills',
      repeat_type: 'weekly',
      repeat_days: [dayOfWeekStr],
      scheduled_time: day.scheduled_time || undefined,
    })

    if (result.injected || result.updated) {
      // Link the daily back to the skill study day
      await supabase.from('skill_study_days').update({ daily_id: result.daily.id }).eq('id', day.id)
      injected++
    } else {
      skipped++
    }
  }

  return { injected, skipped }
}
