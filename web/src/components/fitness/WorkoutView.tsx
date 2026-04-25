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
    <div className="space-y-10 italic">
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Dumbbell size={20} className="text-blue-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">Current Protocol</h2>
        </div>

        {loading ? (
          <div className="h-64 rounded-xl bg-slate-950/40 animate-pulse border border-blue-500/10 shadow-[inset_0_0_30px_rgba(59,130,246,0.05)]" />
        ) : activePlan ? (
          <div className="space-y-6">
            <WorkoutCard plan={activePlan} isActive={true} />
            
            {/* Day Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {activePlan.workout_days?.map((day: any) => (
                <div key={day.id} className="p-4 bg-slate-950/60 border border-blue-500/10 rounded-lg text-center group hover:border-blue-500/40 transition-all hover:bg-blue-900/10 relative overflow-hidden">
                  <span className="block text-[8px] text-blue-500/30 uppercase font-black tracking-[0.2em] mb-2">Phase {day.day_number}</span>
                  <span className="block text-[11px] font-black text-blue-50 uppercase tracking-widest">{day.name}</span>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500/0 group-hover:bg-blue-500/40 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 border border-dashed border-blue-500/20 rounded-xl bg-slate-950/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/[0.02] group-hover:bg-blue-500/[0.05] transition-colors" />
            <Dumbbell size={48} className="text-blue-500/10 mb-6 group-hover:text-blue-500/20 transition-colors" />
            <h3 className="text-sm font-black text-blue-500/40 mb-2 uppercase tracking-[0.3em]">No Active Protocol</h3>
            <p className="text-[10px] text-blue-500/20 font-black uppercase tracking-[0.2em] mb-8">Initialize your transformation sequence.</p>
            <button 
              onClick={handleGeneratePlan}
              className="flex items-center gap-3 px-6 py-3 bg-blue-500/5 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500/10 transition-all shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]"
            >
              System Synthesis <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>

      {!loading && plans.length > 1 && (
        <section>
          <h2 className="text-[10px] font-black mb-6 text-blue-500/30 uppercase tracking-[0.3em]">Archived Protocols</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.filter(p => !p.is_active).map(plan => (
              <WorkoutCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
