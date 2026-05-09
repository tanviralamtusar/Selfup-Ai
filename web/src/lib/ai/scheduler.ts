import { addAiTask } from '../queue'
import { createClient } from '@supabase/supabase-js'

/**
 * PATHFINDER SCHEDULER
 * 
 * Since Redis is disabled, this uses a simple setInterval loop 
 * to trigger proactive AI tasks.
 */

const CHECK_INTERVAL = 1000 * 60 * 60; // Run every hour

export async function initScheduler() {
  console.log('[Pathfinder Scheduler] Initializing Proactive AI checks...');

  // Run immediately on boot
  await runPeriodicChecks();

  // Then run every hour
  setInterval(async () => {
    await runPeriodicChecks();
  }, CHECK_INTERVAL);
}

async function runPeriodicChecks() {
  const now = new Date();
  console.log(`[Pathfinder Scheduler] Running checks at ${now.toISOString()}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Pathfinder Scheduler] Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch active users (e.g. logged in in last 30 days)
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, weekly_summary_day, weekly_summary_time')
    .limit(100); // Process in batches if needed

  if (!users) return;

  for (const user of users) {
    // 1. Proactive Alerts Check (Every hour)
    await addAiTask({
      userId: user.id,
      type: 'proactive_alert_check',
      payload: {}
    });

    // 2. Weekly Summary Check
    if (shouldGenerateWeeklySummary(user, now)) {
      const end = now.toISOString().split('T')[0];
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await addAiTask({
        userId: user.id,
        type: 'weekly_summary_generate',
        payload: { period_start: start, period_end: end }
      });
    }
  }
}

function shouldGenerateWeeklySummary(user: any, now: Date): boolean {
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const hour = now.getHours();

  // Default to Sunday at 8 PM if not set
  const targetDay = user.weekly_summary_day || 'Sunday';
  const targetHour = parseInt((user.weekly_summary_time || '20:00').split(':')[0]);

  return dayName === targetDay && hour === targetHour;
}
