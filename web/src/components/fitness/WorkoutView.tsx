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
    <div className="space-y-10 ">
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Dumbbell size={24} className="text-primary" />
          <h2 className="text-xs   text-primary/60 ">Current Plan</h2>
        </div>

        {loading ? (
          <div className="h-64 rounded-xl bg-card animate-pulse border border-border " />
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
                    className={`p-4 bg-card border rounded-lg text-center group transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[100px] ${
                      isToday 
                        ? 'border-primary-500/50' 
                        : 'border-border hover:border-border hover:bg-muted'
                    }`}
                  >
                    <span className="block text-[10px] text-primary/40   mb-2">Day {day.day_number}</span>
                    <span className="block text-xs  text-foreground">{day.name}</span>
                    
                    {isToday ? (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-primary-400">
                        <Play size={12} fill="currentColor" /> Active Now
                      </div>
                    ) : (
                      <div className="mt-3 text-[9px]  text-muted-foreground group-hover:text-primary transition-colors">
                        View Details
                      </div>
                    )}
                    
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 transition-colors",
                      isToday ? "bg-primary-500" : "bg-primary/0 group-hover:bg-primary/40"
                    )} />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 border border-dashed border-border rounded-xl bg-background/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/[0.02] group-hover:bg-primary/[0.05] transition-colors" />
            <Dumbbell size={48} className="text-muted-foreground mb-6 group-hover:text-muted-foreground transition-colors" />
            <h3 className="text-sm  text-muted-foreground mb-2 ">No Active Plan</h3>
            <p className="text-[10px] text-muted-foreground   mb-8">Create your first fitness plan.</p>
            <button 
              onClick={handleGeneratePlan}
              className="flex items-center gap-3 px-6 py-3 bg-muted text-primary border border-border rounded-lg text-[10px]   hover:bg-primary/10 transition-all "
            >
              Create Plan <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>

      {!loading && plans.length > 1 && (
        <section>
          <h2 className="text-xs  mb-6 text-primary/40  ">Past Plans</h2>
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
