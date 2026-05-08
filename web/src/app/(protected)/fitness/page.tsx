'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, History, Dumbbell, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import WorkoutView from '@/components/fitness/WorkoutView';
import NutritionView from '@/components/fitness/NutritionView';
import BodyView from '@/components/fitness/BodyView';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { AiPlanGeneratorModal } from '@/components/fitness/AiPlanGeneratorModal';
import { PlanPreviewModal } from '@/components/fitness/PlanPreviewModal';
import { DietPlanView } from '@/components/fitness/DietPlanView';
export default function FitnessPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'workout' | 'nutrition' | 'body'>('workout');

  // Level up state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ newLevel: 2, totalXp: 100, coinsReward: 50 });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Authorization': `Bearer ${session?.access_token}`
      };

      const [plansRes, logsRes] = await Promise.all([
        fetch('/api/fitness/plans', { headers }),
        fetch('/api/fitness/logs', { headers })
      ]);
      const [plansData, logsData] = await Promise.all([
        plansRes.json(),
        logsRes.json()
      ]);
      setPlans(Array.isArray(plansData.data) ? plansData.data : []);
      setLogs(Array.isArray(logsData.data) ? logsData.data : []);
    } catch (err) {
      toast.error('Failed to load fitness data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenAiModal = () => setIsAiModalOpen(true);

  const handleGeneratePlan = async (goal: string, days: number) => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      };

      const res = await fetch('/api/ai/queue', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'fitness_plan',
          payload: { goal, days }
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === 'completed') {
        setIsGenerating(false);
        setIsAiModalOpen(false);
        
        if (data.result && data.result.plan_meta) {
          setPreviewData(data.result);
          setIsPreviewModalOpen(true);
        } else {
          toast.success('Your AI fitness plan is ready!');
          fetchDashboardData();
        }
      } else {
        throw new Error(data.error || 'Failed to generate plan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start AI generation');
      setIsGenerating(false);
    }
  };

  const activePlan = plans.find(p => p.is_active);

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20 italic">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="relative group">
          <div className="relative">
            <h1 className="text-4xl font-black tracking-[0.3em] mb-2 uppercase">
              Fitness <span className="text-blue-500">Center</span>
            </h1>
            <div className="text-blue-500/40 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
              AI Powered Workout & Nutrition
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleOpenAiModal}
            disabled={isGenerating}
            className="relative group flex items-center gap-3 px-6 py-3 bg-slate-950 border border-blue-500/30 rounded-xl text-blue-100 font-black text-[10px] uppercase tracking-[0.2em] transition-all overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:border-blue-500/60"
          >
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin text-blue-400" />
            ) : (
              <Sparkles size={16} className="text-blue-400 group-hover:rotate-12 transition-transform" />
            )}
            {isGenerating ? 'Loading...' : 'AI Plan'}
          </button>
          
          <button 
            onClick={handleOpenAiModal}
            className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={16} />
            New Plan
          </button>
        </div>
      </div>

      {/* ── Tabs Menu ── */}
      <div className="flex bg-slate-950/40 border border-blue-500/10 rounded-xl p-1 mb-10 overflow-x-auto scrollbar-hide backdrop-blur-sm">
        {(['workout', 'nutrition', 'body'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 md:flex-none min-w-[140px] py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative rounded-lg",
              activeTab === tab ? 'text-blue-50 bg-blue-600/20 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)] border border-blue-500/30' : 'text-blue-500/40 hover:text-blue-300 hover:bg-blue-500/5'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'workout' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <WorkoutView plans={plans} loading={loading} handleGeneratePlan={handleOpenAiModal} />
              </div>

              <div className="space-y-10">
                <section className="bg-slate-950/40 border border-blue-500/20 rounded-xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-16 bg-blue-500/10 group-hover:bg-blue-500/30 transition-colors" />
                  <div className="flex items-center gap-3 mb-6">
                    <History size={18} className="text-blue-500" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">Workout History</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {logs.length > 0 ? (
                      logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="p-4 bg-slate-950/60 border border-blue-500/10 rounded-lg hover:border-blue-500/40 transition-all hover:bg-blue-900/10 relative group/log overflow-hidden">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">+{log.xp_earned} XP</span>
                            <div className="flex items-center gap-2">
                              {log.status === 'partial' && (
                                <span className="text-[7px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-tighter">In Progress</span>
                              )}
                              <span className="text-[8px] font-black text-blue-500/30 uppercase tracking-widest">{new Date(log.completed_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <h4 className="text-[11px] font-black text-blue-50 mb-1 uppercase tracking-widest">{log.day_name || 'Workout Complete'}</h4>
                          <p className="text-[10px] text-blue-500/60 line-clamp-1 italic italic leading-relaxed">"{log.notes || 'No log data recorded.'}"</p>
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/0 group-hover/log:bg-blue-500/40 transition-colors" />
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-blue-500/20 italic text-[10px] font-black uppercase tracking-widest border border-dashed border-blue-500/10 rounded-xl">
                        NO WORKOUTS LOGGED
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            activePlan?.diet_plans?.[0] ? (
              <DietPlanView dietPlan={activePlan.diet_plans[0]} />
            ) : (
              <NutritionView />
            )
          )}
          {activeTab === 'body' && <BodyView />}
        </motion.div>
      </AnimatePresence>

      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        newLevel={levelUpData.newLevel}
        totalXp={levelUpData.totalXp}
        coinsReward={levelUpData.coinsReward}
      />

      <AiPlanGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSubmit={handleGeneratePlan}
        isGenerating={isGenerating}
      />

      <PlanPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          fetchDashboardData();
        }}
        previewData={previewData}
      />
    </div>
  );
}
