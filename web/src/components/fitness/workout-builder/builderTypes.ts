// ═══════════════════════════════════════════════════════════
// Workout-builder shared types + equipment config
// (workout-cool stepper flow, restyled to the app's dark theme)
// ═══════════════════════════════════════════════════════════

export interface BuilderExercise {
  id: string;
  name: string;
  muscle_group: string;
  primary_muscle?: string | null;
  equipment: string | null;
  difficulty: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  technique_note?: string | null;
}

export interface EquipmentOption {
  value: string; // internal id
  label: string;
  // Underlying exercises.equipment values this option maps to.
  dbValues: string[];
}

// Grouped from the real equipment distribution in the library.
export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: 'bodyweight', label: 'Bodyweight', dbValues: ['none'] },
  { value: 'dumbbells', label: 'Dumbbells', dbValues: ['dumbbells'] },
  { value: 'barbell', label: 'Barbell', dbValues: ['barbell', 'ez bar'] },
  { value: 'cable', label: 'Cable', dbValues: ['cable'] },
  { value: 'machine', label: 'Machine', dbValues: ['machine'] },
  { value: 'kettlebells', label: 'Kettlebell', dbValues: ['kettlebells'] },
  { value: 'bands', label: 'Bands', dbValues: ['bands'] },
  { value: 'ball', label: 'Ball', dbValues: ['medicine ball', 'exercise ball'] },
  { value: 'other', label: 'Other', dbValues: ['other', 'foam roll', 'pull-up bar'] },
];

// Resolve selected option ids → the flat list of exercises.equipment values.
export function equipmentDbValues(selected: string[]): string[] {
  const opts = EQUIPMENT_OPTIONS.filter((o) => selected.includes(o.value));
  return [...new Set(opts.flatMap((o) => o.dbValues))];
}
