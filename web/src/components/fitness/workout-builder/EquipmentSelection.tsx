'use client';

// Equipment picker — grid of toggle cards (workout-cool step 2, dark themed).
import React from 'react';
import { Check, Dumbbell, Cable, Grip, Activity, Circle, PersonStanding, Zap } from 'lucide-react';
import { EQUIPMENT_OPTIONS } from './builderTypes';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  bodyweight: PersonStanding,
  dumbbells: Dumbbell,
  barbell: Dumbbell,
  cable: Cable,
  machine: Grip,
  kettlebells: Activity,
  bands: Zap,
  ball: Circle,
  other: Circle,
};

interface EquipmentSelectionProps {
  selected: string[];
  onToggle: (value: string) => void;
}

export function EquipmentSelection({ selected, onToggle }: EquipmentSelectionProps) {
  return (
    <div>
      <p className="text-center text-sm text-zinc-400 mb-5">
        What equipment do you have? Leave empty for all.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {EQUIPMENT_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const Icon = ICONS[opt.value] ?? Circle;
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={[
                'group relative overflow-hidden rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-2',
                'transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97]',
                isSelected
                  ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-blue-600/5 shadow-lg shadow-blue-500/10'
                  : 'border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 hover:border-zinc-700',
              ].join(' ')}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </span>
              )}
              <Icon
                size={28}
                className={isSelected ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}
              />
              <span
                className={[
                  'text-xs font-semibold uppercase tracking-wide',
                  isSelected ? 'text-blue-300' : 'text-zinc-400',
                ].join(' ')}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
