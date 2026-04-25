import React from 'react'
import { Dumbbell, ArrowRight } from 'lucide-react'
import WorkoutCard from '@/components/fitness/WorkoutCard'

interface WorkoutViewProps {
  plans: any[]
  loading: boolean
  handleGeneratePlan: () => void
}

export default function WorkoutView({ plans, loading, handleGeneratePlan }: WorkoutViewProps) {
  const activePlan = plans.find(p => p.is_active)

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell size={20} className="text-indigo-500" />
          <h2 className="text-xl font-bold">Current Protocol</h2>
        </div>

        {loading ? (
          <div className="h-48 rounded-xl bg-zinc-900/50 animate-pulse border border-zinc-800" />
        ) : activePlan ? (
          <div className="space-y-4">
            <WorkoutCard plan={activePlan} isActive={true} />
            
            {/* Day Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activePlan.workout_days?.map((day: any) => (
                <div key={day.id} className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Day {day.day_number}</span>
                  <span className="block text-sm font-semibold">{day.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <Dumbbell size={40} className="text-zinc-700 mb-4" />
            <h3 className="text-lg font-bold text-zinc-400 mb-1">No Active Protocol</h3>
            <p className="text-zinc-500 text-sm mb-6">Start by building a custom plan or let System generate one.</p>
            <button 
              onClick={handleGeneratePlan}
              className="flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
            >
              Generate Plan with System <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>

      {!loading && plans.length > 1 && (
        <section>
          <h2 className="text-lg font-bold mb-4 text-zinc-400 uppercase tracking-widest text-xs">Other Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.filter(p => !p.is_active).map(plan => (
              <WorkoutCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
