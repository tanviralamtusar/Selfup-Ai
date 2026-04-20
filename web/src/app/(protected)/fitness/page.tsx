'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, History, Dumbbell, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutCard from '@/components/fitness/WorkoutCard';
import { toast } from 'sonner';

export default function FitnessPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [plansRes, logsRes] = await Promise.all([
        fetch('/api/fitness/plans'),
        fetch('/api/fitness/logs')
      ]);
      const [plansData, logsData] = await Promise.all([
        plansRes.json(),
        logsRes.json()
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      toast.error('Failed to load fitness data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'generate_fitness_plan',
          payload: {
            goal: 'muscle_gain',
            difficulty: 'intermediate',
            days_per_week: 4
          }
        })
      });
      
      if (res.ok) {
        toast.success('Nova is drafting your plan. Check back in a minute!');
        // In a real app, we'd poll or use websockets here
      }
    } catch (err) {
      toast.error('Failed to start AI generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const activePlan = plans.find(p => p.is_active);

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic uppercase">
            War Room <span className="text-indigo-500">Fitness</span>
          </h1>
          <p className="text-zinc-500 text-sm max-w-md">
            Optimize your physical vessel. High-performance training for the modern high-performer.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-indigo-500/50 text-white font-bold text-sm transition-all group"
          >
            {isGenerating ? (
              <Loader2 size={18} className="animate-spin text-indigo-400" />
            ) : (
              <Sparkles size={18} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
            )}
            {isGenerating ? 'Nova Generating...' : 'Nova AI Plan'}
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-900/40 transition-all">
            <Plus size={18} />
            Build Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active & Available Plans */}
        <div className="lg:col-span-2 space-y-8">
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
                <p className="text-zinc-500 text-sm mb-6">Start by building a custom plan or let Nova generate one.</p>
                <button 
                  onClick={handleGeneratePlan}
                  className="flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                >
                  Generate Plan with Nova <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>

          {plans.length > 1 && (
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

        {/* Sidebar Activity */}
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <History size={20} className="text-indigo-500" />
              <h2 className="text-xl font-bold">Recent Output</h2>
            </div>
            
            <div className="space-y-3">
              {logs.length > 0 ? (
                logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-emerald-400">+{log.xp_earned} XP</span>
                      <span className="text-[10px] text-zinc-600">{new Date(log.completed_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">Workout Session</h4>
                    <p className="text-xs text-zinc-500 line-clamp-1 italic">"{log.notes || 'No notes'}"</p>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-600 italic text-sm">
                  No activities logged yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
