// ═══════════════════════════════════════════════════════════
// Sample Program Seeder (phase 4)
// Inserts one demo structured program built from exercises already
// in the library, so the Programs catalog isn't empty.
//
// Prereqs: run scripts/migrations/create_programs.sql first, and have
// the exercise library seeded (npm run seed:exercises).
//
// Usage:  npm run seed:programs
// Idempotent: skips if the demo program's slug already exists.
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const DEMO_SLUG = 'foundations-strength-4w';

// Each session lists exercise search terms (matched against the library by name)
// plus the suggested sets to store as JSONB.
type SessionTemplate = {
  title: string;
  exercises: { search: string; sets: { reps: number; weight?: number }[] }[];
};

const strengthTriple = (reps: number) => [{ reps }, { reps }, { reps }];

const PROGRAM = {
  title: 'Foundations of Strength',
  description: 'A 4-week, 3-day full-body program to build a base of strength with the main compound lifts.',
  category: 'Strength',
  level: 'beginner' as const,
  program_type: 'strength',
  duration_weeks: 4,
  sessions_per_week: 3,
  session_duration_min: 45,
  equipment: ['barbell', 'dumbbells'],
};

const WEEK_BLUEPRINT: SessionTemplate[] = [
  {
    title: 'Full Body A — Squat focus',
    exercises: [
      { search: 'Barbell Squat', sets: strengthTriple(5) },
      { search: 'Bench Press', sets: strengthTriple(5) },
      { search: 'Bent Over Barbell Row', sets: strengthTriple(8) },
    ],
  },
  {
    title: 'Full Body B — Deadlift focus',
    exercises: [
      { search: 'Barbell Deadlift', sets: strengthTriple(5) },
      { search: 'Overhead Press', sets: strengthTriple(5) },
      { search: 'Pullups', sets: strengthTriple(8) },
    ],
  },
  {
    title: 'Full Body C — Accessory',
    exercises: [
      { search: 'Barbell Squat', sets: strengthTriple(8) },
      { search: 'Incline Dumbbell Press', sets: strengthTriple(10) },
      { search: 'Dumbbell Bicep Curl', sets: strengthTriple(12) },
    ],
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Guard: programs table must exist.
  const { error: tableErr } = await supabase.from('programs').select('id').limit(1);
  if (tableErr) {
    console.error('`programs` table not found. Run scripts/migrations/create_programs.sql first.');
    process.exit(1);
  }

  // Idempotency: skip if already seeded.
  const { data: existing } = await supabase.from('programs').select('id').eq('slug', DEMO_SLUG).maybeSingle();
  if (existing) {
    console.log(`Demo program "${DEMO_SLUG}" already exists (${existing.id}). Nothing to do.`);
    return;
  }

  // Resolve exercise names → ids once.
  const uniqueSearches = [...new Set(WEEK_BLUEPRINT.flatMap((s) => s.exercises.map((e) => e.search)))];
  const exerciseIdBySearch = new Map<string, string>();
  for (const term of uniqueSearches) {
    const { data } = await supabase.from('exercises').select('id, name').ilike('name', `%${term}%`).limit(1);
    if (data?.[0]) exerciseIdBySearch.set(term, data[0].id);
    else console.warn(`  (no library match for "${term}" — will skip that exercise)`);
  }

  // Create the program.
  const { data: program, error: progErr } = await supabase
    .from('programs')
    .insert({ ...PROGRAM, slug: DEMO_SLUG, visibility: 'published', is_premium: false, is_active: true })
    .select('id')
    .single();
  if (progErr) throw progErr;
  console.log(`Created program ${program.id}`);

  // Build the identical 3-session blueprint for each of the 4 weeks.
  for (let w = 1; w <= PROGRAM.duration_weeks; w++) {
    const { data: week, error: weekErr } = await supabase
      .from('program_weeks')
      .insert({ program_id: program.id, week_number: w, title: `Week ${w}` })
      .select('id')
      .single();
    if (weekErr) throw weekErr;

    for (let s = 0; s < WEEK_BLUEPRINT.length; s++) {
      const tmpl = WEEK_BLUEPRINT[s];
      const { data: sess, error: sessErr } = await supabase
        .from('program_sessions')
        .insert({
          week_id: week.id,
          session_number: s + 1,
          title: tmpl.title,
          estimated_minutes: PROGRAM.session_duration_min,
          equipment: PROGRAM.equipment,
        })
        .select('id')
        .single();
      if (sessErr) throw sessErr;

      const rows = tmpl.exercises
        .map((e, order) => {
          const exId = exerciseIdBySearch.get(e.search);
          if (!exId) return null;
          return {
            session_id: sess.id,
            exercise_id: exId,
            order_index: order,
            instructions: `${e.sets.length} sets of ${e.sets[0].reps} reps`,
            suggested_sets: e.sets.map((set, i) => ({
              set_index: i,
              type: 'reps',
              reps: set.reps,
              ...(set.weight ? { weight: set.weight, unit: 'kg' } : {}),
            })),
          };
        })
        .filter(Boolean);

      if (rows.length) {
        const { error: exErr } = await supabase.from('program_session_exercises').insert(rows as any[]);
        if (exErr) throw exErr;
      }
    }
  }

  console.log(`\nDone. Seeded "${PROGRAM.title}" — ${PROGRAM.duration_weeks} weeks × ${WEEK_BLUEPRINT.length} sessions.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
