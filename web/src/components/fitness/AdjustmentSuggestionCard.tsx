'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface AdjustmentSuggestionCardProps {
  adjustment: any; // plan_adjustments row
  onResolve: () => void;
}

export function AdjustmentSuggestionCard({ adjustment, onResolve }: AdjustmentSuggestionCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!adjustment || adjustment.status !== 'pending') return null;

  const handleAction = async (action: 'approve' | 'ignore') => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/fitness/plans/${adjustment.plan_id}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment_id: adjustment.id, action })
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error);
      
      toast.success(action === 'approve' ? 'Adjustment Applied' : 'Suggestion Dismissed');
      onResolve();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process adjustment');
      setIsProcessing(false);
    }
  };

  const isPositive = adjustment.reason === 'overperforming';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-2xl p-5 relative overflow-hidden ${
        isPositive 
          ? 'bg-primary-900/20 border-primary-500/30' 
          : 'bg-orange-900/20 border-orange-500/30'
      }`}
    >
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Sparkles size={100} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
            <Sparkles size={20} className={isPositive ? "text-primary-400" : "text-orange-400"} />
            AI Protocol Adjustment
          </h3>
          <p className="text-sm text-gray-300">
            {isPositive 
              ? "You've been crushing it! The AI suggests increasing the difficulty to maximize growth." 
              : "Looks like you missed a few sessions. The AI suggests a slight adjustment to help you stay consistent."}
          </p>
          
          <div className="mt-4 bg-black/30 p-3 rounded-lg border border-white/5 inline-block">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <ArrowRight size={16} className="text-white" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-white">
                  {adjustment.suggestion?.change || "Optimize Protocol"}
                </span>
                <span className="block text-xs text-gray-400">
                  {adjustment.suggestion?.details || "Tap approve to apply this change."}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => handleAction('ignore')}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Ignore
          </button>
          <button 
            onClick={() => handleAction('approve')}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              isPositive 
                ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' 
                : 'bg-orange-600 text-white hover:bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
            }`}
          >
            {isProcessing ? 'Applying...' : <><Check size={18} /> Apply Change</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
