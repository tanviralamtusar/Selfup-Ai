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
    <div className="min-h-screen bg-black text-white p-6 pb-20 ">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="relative group">
          <div className="relative">
            <h1 className="text-4xl   mb-2">
              Fitness <span className="text-primary">Center</span>
            </h1>
            <div className="text-muted-foreground text-[10px]   flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              AI Powered Workout & Nutrition
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleOpenAiModal}
            disabled={isGenerating}
            className="relative group flex items-center gap-3 px-6 py-3 bg-background border border-border rounded-xl text-foreground  text-[10px]  transition-all overflow-hidden  hover:border-border"
          >
            <div className="absolute inset-0 bg-muted group-hover:bg-primary/10 transition-colors" />
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <Sparkles size={16} className="text-primary group-hover:rotate-12 transition-transform" />
            )}
            {isGenerating ? 'Loading...' : 'AI Plan'}
          </button>
          
          <button 
            onClick={handleOpenAiModal}
            className="flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-xl  text-[10px]   border border-primary/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={16} />
            New Plan
          </button>
        </div>
      </div>

      {/* ── Tabs Menu ── */}
      <div className="flex bg-card border border-border rounded-xl p-1 mb-10 overflow-x-auto scrollbar-hide">
        {(['workout', 'nutrition', 'body'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 md:flex-none min-w-[140px] py-3 text-[10px]   transition-all relative rounded-lg",
              activeTab === tab ? 'text-foreground bg-primary/20  border border-border' : 'text-muted-foreground hover:text-primary/80 hover:bg-muted'
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
                <section className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-16 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                  <div className="flex items-center gap-3 mb-6">
                    <History size={18} className="text-primary" />
                    <h2 className="text-[10px]   text-muted-foreground">Workout History</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {logs.length > 0 ? (
                      logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="p-4 bg-card border border-border rounded-lg hover:border-border transition-all hover:bg-muted relative group/log overflow-hidden">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px]  text-primary bg-primary/10 px-2 py-0.5 rounded border border-border">+{log.xp_earned} XP</span>
                            <div className="flex items-center gap-2">
                              {log.status === 'partial' && (
                                <span className="text-[7px]  bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 tracking-tighter">In Progress</span>
                              )}
                              <span className="text-[8px]  text-muted-foreground">{new Date(log.completed_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <h4 className="text-[11px]  text-foreground mb-1">{log.day_name || 'Workout Complete'}</h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-1   leading-relaxed">"{log.notes || 'No log data recorded.'}"</p>
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover/log:bg-primary/40 transition-colors" />
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-muted-foreground  text-[10px]  border border-dashed border-border rounded-xl">
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
