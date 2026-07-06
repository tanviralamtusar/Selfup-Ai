// ═══════════════════════════════════════════════════════════
// Muscle-map types & mappings (workout-cool port, phase 2)
//
// The SVG body diagram is ported from workout-cool (MIT) and uses
// uppercase muscle identifiers. This module maps those to the values
// stored in our Supabase `exercises` table:
//   - primary_muscle (granular, lowercase — from free-exercise-db)
//   - muscle_group   (broad Title-Case group used by the app)
// ═══════════════════════════════════════════════════════════

// The 13 muscle groups the diagram can select (matches the SVG groups exactly).
export type MuscleValue =
  | 'CHEST'
  | 'BACK'
  | 'TRAPS'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'FOREARMS'
  | 'ABDOMINALS'
  | 'OBLIQUES'
  | 'QUADRICEPS'
  | 'HAMSTRINGS'
  | 'GLUTES'
  | 'CALVES';

// Human-readable labels for chips/legend.
export const MUSCLE_LABELS: Record<MuscleValue, string> = {
  CHEST: 'Chest',
  BACK: 'Back',
  TRAPS: 'Traps',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  ABDOMINALS: 'Abs',
  OBLIQUES: 'Obliques',
  QUADRICEPS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
};

// Map a diagram muscle → the granular `primary_muscle` values that match it
// in the exercises table. free-exercise-db uses lowercase muscle names.
// BACK covers lats + mid/lower back since the diagram has no separate lats group.
export const MUSCLE_TO_PRIMARY: Record<MuscleValue, string[]> = {
  CHEST: ['chest'],
  BACK: ['lats', 'middle back', 'lower back'],
  TRAPS: ['traps', 'neck'],
  SHOULDERS: ['shoulders'],
  BICEPS: ['biceps'],
  TRICEPS: ['triceps'],
  FOREARMS: ['forearms'],
  ABDOMINALS: ['abdominals'],
  OBLIQUES: ['abdominals'], // free-exercise-db has no separate obliques
  QUADRICEPS: ['quadriceps'],
  HAMSTRINGS: ['hamstrings'],
  GLUTES: ['glutes'],
  CALVES: ['calves'],
};

// Fallback map to the app's broad `muscle_group` column (for rows that
// predate the attributes migration and have no primary_muscle set).
export const MUSCLE_TO_GROUP: Record<MuscleValue, string> = {
  CHEST: 'Chest',
  BACK: 'Back',
  TRAPS: 'Back',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Arms',
  TRICEPS: 'Arms',
  FOREARMS: 'Arms',
  ABDOMINALS: 'Core',
  OBLIQUES: 'Core',
  QUADRICEPS: 'Legs',
  HAMSTRINGS: 'Legs',
  GLUTES: 'Legs',
  CALVES: 'Legs',
};

// Build the set of granular primary_muscle values for a selection.
export function primaryMusclesFor(selected: MuscleValue[]): string[] {
  return [...new Set(selected.flatMap((m) => MUSCLE_TO_PRIMARY[m] ?? []))];
}

// Build the set of broad muscle_group values for a selection.
export function groupsFor(selected: MuscleValue[]): string[] {
  return [...new Set(selected.map((m) => MUSCLE_TO_GROUP[m]))];
}
