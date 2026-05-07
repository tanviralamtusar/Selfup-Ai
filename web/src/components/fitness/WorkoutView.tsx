import React from 'react'
import { Dumbbell, ArrowRight, Play } from 'lucide-react'
import WorkoutCard from '@/components/fitness/WorkoutCard'
import { AdjustmentSuggestionCard } from './AdjustmentSuggestionCard'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface WorkoutViewProps {
  plans: any[]
  loading: boolean
  handleGeneratePlan: () => void
}

export default function WorkoutView({ plans, loading, handleGeneratePlan }: WorkoutViewProps) {
  const activePlan = plans.find(p => p.is_active)
  const currentDay = activePlan?.workout_days?.find((day: any) => 
    new Date(day.scheduled_date).toDateString() === new Date().toDateString()
  )

  return (
    <div className="space-y-10 italic">
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Dumbbell size={24} className="text-blue-400" />
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400/60 italic">Current Protocol</h2>
        </div>

        {loading ? (
          <div className="h-64 rounded-xl bg-slate-950/40 animate-pulse border border-blue-500/10 shadow-[inset_0_0_30px_rgba(59,130,246,0.05)]" />
        ) : activePlan ? (
          <div className="space-y-6">
            <WorkoutCard plan={activePlan} isActive={true} currentDayId={currentDay?.id} />
            
            {/* Adjustments */}
            {activePlan.plan_adjustments?.filter((a: any) => a.status === 'pending').map((adj: any) => (
              <AdjustmentSuggestionCard key={adj.id} adjustment={adj} onResolve={() => window.location.reload()} />
            ))}

            {/* Day Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...(activePlan.workout_days || [])].sort((a: any, b: any) => a.day_number - b.day_number).map((day: any) => {
                const isToday = new Date(day.scheduled_date).toDateString() === new Date().toDateString();
                const isRestDay = day.name?.toLowerCase().includes('rest');
                
                return (
                  <Link 
                    key={day.id} 
                    href={`/fitness/session/${day.id}`}
                    className={`p-4 bg-slate-950/60 border rounded-lg text-center group transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[100px] ${
                      isToday 
                        ? 'border-primary-500/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]' 
                        : 'border-blue-500/10 hover:border-blue-500/40 hover:bg-blue-900/10'
                    }`}
                  >
                    <span className="block text-[10px] text-blue-400/40 uppercase font-black tracking-[0.2em] mb-2">Phase {day.day_number}</span>
                    <span className="block text-xs font-black text-blue-50 uppercase tracking-widest">{day.name}</span>
                    
                    {isToday ? (
                      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-primary-400">
                        <Play size={12} fill="currentColor" /> Active Now
                      </div>
                    ) : (
                      <div className="mt-3 text-[9px] uppercase tracking-widest font-black text-blue-500/20 group-hover:text-blue-400 transition-colors">
                        View Protocol
                      </div>
                    )}
                    
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 transition-colors",
                      isToday ? "bg-primary-500" : "bg-blue-500/0 group-hover:bg-blue-500/40"
                    )} />
                  </Link>
                );
              })}
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
          <h2 className="text-xs font-black mb-6 text-blue-400/40 uppercase tracking-[0.3em] italic">Archived Protocols</h2>
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
