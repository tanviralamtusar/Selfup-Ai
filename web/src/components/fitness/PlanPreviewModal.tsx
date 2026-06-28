'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Dumbbell, Flame, CheckCircle, ChevronRight, Apple } from 'lucide-react';
import type { GeneratedPlan } from '@/types/fitness';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: any; // Data stored in ai_queue.result
}

export function PlanPreviewModal({ isOpen, onClose, previewData }: PlanPreviewModalProps) {
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen || !previewData) return null;

  const handleActivate = async () => {
    setIsActivating(true);
    // In a real implementation, you might want to mark the queue task as "accepted"
    // and then clear the pending state from the UI.
    // For now, we'll just show a success toast and close, since the worker already
    // generated and saved the plan in the DB.
    setTimeout(() => {
      toast.success('Protocol Activated! Dailies injected.', { icon: '🚀' });
      setIsActivating(false);
      onClose();
      router.refresh();
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-dark-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Dumbbell size={120} />
            </div>
            
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-black/20 rounded-full">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-2 text-primary-400 font-medium mb-2 text-sm">
              <Flame size={16} /> New Protocol Ready
            </div>
            <h2 className="text-3xl font-medium text-white mb-2">{previewData.plan_meta?.name || 'Your Fitness Plan'}</h2>
            <p className="text-gray-400 max-w-md">{previewData.plan_meta?.description}</p>
            
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <Calendar size={16} className="text-primary" />
                <span className="text-sm font-medium text-white">{previewData.plan_meta?.days_per_week || 3} Days/Week</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <Trophy size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-white">~{previewData.total_xp_per_week || 0} XP/Week</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded font-medium">
                  -{previewData.coin_cost} AiC
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-black/20">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-primary-400" /> Schedule Summary
              </h3>
              <div className="space-y-3">
                {previewData.schedule_summary?.map((day: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-dark-bg rounded-lg flex flex-col items-center justify-center border border-border">
                        <span className="text-xs text-gray-500">{day.day.substring(0,3)}</span>
                        <span className="text-sm font-medium text-white">{day.time || 'Any'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white capitalize">{day.label}</p>
                        <p className="text-xs text-gray-400">Workout Day {idx + 1}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                <Apple size={18} /> Nutrition Protocol Included
              </h3>
              <p className="text-sm text-gray-300 mb-2">
                This protocol includes an integrated diet plan and macros targeting your specific goals. Daily tracking habits will be injected.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-end gap-3 bg-dark-surface">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-muted transition-colors"
            >
              Review Later
            </button>
            <button 
              onClick={handleActivate}
              disabled={isActivating}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50"
            >
              {isActivating ? 'Activating...' : (
                <>Accept & Inject <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Ensure Trophy is imported above
function Trophy(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
}
