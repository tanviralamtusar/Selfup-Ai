'use client';

// Dark-themed 3-step header (ported layout from workout-cool's stepper-header).
import React from 'react';
import { Check } from 'lucide-react';

export interface StepDef {
  number: number;
  title: string;
  description: string;
}

interface StepperHeaderProps {
  steps: StepDef[];
  currentStep: number;
  onStepClick?: (n: number) => void;
}

export function StepperHeader({ steps, currentStep, onStepClick }: StepperHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2 mb-8">
      {steps.map((step, idx) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const canClick = step.number < currentStep;
        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick?.(step.number)}
                className={[
                  'flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-200',
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isActive
                      ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-500',
                  canClick ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
              >
                {isCompleted ? <Check size={20} /> : <span className="text-sm font-bold">{step.number}</span>}
              </button>
              <div className="mt-2.5">
                <h3
                  className={[
                    'text-[11px] font-bold uppercase tracking-wide transition-colors',
                    isCompleted ? 'text-emerald-400' : isActive ? 'text-blue-400' : 'text-zinc-500',
                  ].join(' ')}
                >
                  {step.title}
                </h3>
                <p className="hidden sm:block text-[10px] text-zinc-600 mt-0.5">{step.description}</p>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={[
                  'h-0.5 flex-1 mt-5 rounded-full transition-colors',
                  step.number < currentStep ? 'bg-emerald-500/60' : 'bg-zinc-800',
                ].join(' ')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
