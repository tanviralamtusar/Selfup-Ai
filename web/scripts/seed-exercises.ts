// ═══════════════════════════════════════════════════════════
// Exercise Library Seeder
// Seeds the global `exercises` table from the open-source
// free-exercise-db dataset (~873 exercises, public domain).
// https://github.com/yuhonas/free-exercise-db
//
// Usage:  npm run seed:exercises            (fetches from GitHub)
//         npm run seed:exercises -- path.json  (local dataset file)
//
// Safe to re-run: inserts use ON CONFLICT (name) DO NOTHING so
// existing rows (incl. AI-upserted ones) are never overwritten.
//
// Optional enrichment: run scripts/migrations/add_exercise_media_columns.sql
// in the Supabase SQL editor first, and this script will also fill
// primary_muscle, secondary_muscles and image_urls.
// ═══════════════════════════════════════════════════════════

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const DATASET_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

interface DatasetExercise {
  id: string;
  name: string;
  force: string | null;
  level: string; // beginner | intermediate | expert
  mechanic: string | null; // compound | isolation
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string; // strength | stretching | cardio | ...
  images: string[];
}

// Map granular dataset muscles → the broad Title-Case groups the app
// already uses (see existing rows + AI plan generator conventions).
const MUSCLE_GROUP_MAP: Record<string, string> = {
  chest: 'Chest',
  quadriceps: 'Legs',
  hamstrings: 'Legs',
  calves: 'Legs',
  glutes: 'Legs',
  adductors: 'Legs',
  abductors: 'Legs',
  lats: 'Back',
  'middle back': 'Back',
  'lower back': 'Back',
  traps: 'Back',
  neck: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Arms',
  triceps: 'Arms',
  forearms: 'Arms',
  abdominals: 'Core',
};

// Normalize dataset equipment to the app's lowercase conventions.
const EQUIPMENT_MAP: Record<string, string> = {
  'body only': 'none',
  dumbbell: 'dumbbells',
  'e-z curl bar': 'ez bar',
};

const DIFFICULTY_MAP: Record<string, string> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  expert: 'advanced',
};

function mapExercise(ex: DatasetExercise) {
  const primary = ex.primaryMuscles[0] ?? '';
  return {
    user_id: null, // global library entry
    name: ex.name,
    muscle_group: MUSCLE_GROUP_MAP[primary] ?? 'Full body',
    equipment: ex.equipment ? (EQUIPMENT_MAP[ex.equipment] ?? ex.equipment) : 'none',
    difficulty: DIFFICULTY_MAP[ex.level] ?? 'intermediate',
    instructions: ex.instructions.join('\n'),
    technique_note: ex.mechanic
      ? `${ex.mechanic}${ex.force ? ` · ${ex.force}` : ''} · ${ex.category}`
      : ex.category,
    // Only used when the optional media columns exist (see migration):
    primary_muscle: primary || null,
    secondary_muscles: ex.secondaryMuscles,
    image_urls: ex.images.map((img) => `${IMAGE_BASE_URL}${img}`),
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // Load dataset (local file arg or fetch from GitHub)
  const localPath = process.argv[2];
  let dataset: DatasetExercise[];
  if (localPath) {
    dataset = JSON.parse(readFileSync(localPath, 'utf-8'));
    console.log(`Loaded ${dataset.length} exercises from ${localPath}`);
  } else {
    const res = await fetch(DATASET_URL);
    if (!res.ok) throw new Error(`Failed to fetch dataset: ${res.status}`);
    dataset = (await res.json()) as DatasetExercise[];
    console.log(`Fetched ${dataset.length} exercises from free-exercise-db`);
  }

  // Detect whether the optional media columns exist
  const { error: probeError } = await supabase.from('exercises').select('image_urls').limit(1);
  const hasMediaColumns = !probeError;
  console.log(
    hasMediaColumns
      ? 'Media columns detected — seeding with images + granular muscles.'
      : 'Media columns not found — seeding core fields only. (Run scripts/migrations/add_exercise_media_columns.sql to enable images.)'
  );

  const rows = dataset.map((ex) => {
    const mapped = mapExercise(ex);
    if (!hasMediaColumns) {
      const { primary_muscle, secondary_muscles, image_urls, ...core } = mapped;
      return core;
    }
    return mapped;
  });

  // Insert in chunks; skip rows whose name already exists
  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('exercises')
      .upsert(chunk, { onConflict: 'name', ignoreDuplicates: true })
      .select('id');
    if (error) {
      console.error(`Chunk ${i / CHUNK + 1} failed:`, error.message);
      process.exit(1);
    }
    inserted += data?.length ?? 0;
    console.log(`  chunk ${i / CHUNK + 1}/${Math.ceil(rows.length / CHUNK)} → ${data?.length ?? 0} inserted`);
  }

  // Enrichment pass: fill media columns on rows that were inserted before
  // the migration existed (insert-on-conflict skips them).
  if (hasMediaColumns) {
    const byName = new Map(dataset.map((ex) => [ex.name, mapExercise(ex)]));
    const { data: bare } = await supabase
      .from('exercises')
      .select('id, name')
      .or('image_urls.is.null,image_urls.eq.{}');
    const toEnrich = (bare ?? []).filter((row) => byName.has(row.name));
    console.log(`Enriching ${toEnrich.length} existing rows with media data...`);
    for (let i = 0; i < toEnrich.length; i += 50) {
      await Promise.all(
        toEnrich.slice(i, i + 50).map((row) => {
          const m = byName.get(row.name)!;
          return supabase
            .from('exercises')
            .update({
              primary_muscle: m.primary_muscle,
              secondary_muscles: m.secondary_muscles,
              image_urls: m.image_urls,
            })
            .eq('id', row.id);
        })
      );
    }
  }

  const { count } = await supabase.from('exercises').select('*', { count: 'exact', head: true });
  console.log(`\nDone. ${inserted} new exercises inserted. Library total: ${count} rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
