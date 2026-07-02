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
      className={`border rounded-xl p-5 relative overflow-hidden ${
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
          <h3 className="text-xl  text-primary-foreground flex items-center gap-2 mb-2 tracking-wide">
            <Sparkles size={22} className={isPositive ? "text-primary-400" : "text-orange-400"} />
            AI Plan Update
          </h3>
          <p className="text-base text-gray-300 font-medium ">
            {isPositive 
              ? "You've been crushing it! The AI suggests increasing the difficulty to maximize growth." 
              : "Looks like you missed a few sessions. The AI suggests a slight adjustment to help you stay consistent."}
          </p>
          
          <div className="mt-5 bg-black/40 p-4 rounded-xl border border-white/5 inline-block shadow-inner">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <ArrowRight size={20} className="text-white" />
              </div>
              <div>
                <span className="block text-base  text-primary-foreground">
                  {adjustment.suggestion?.change || "Update Plan"}
                </span>
                <span className="block text-[11px] text-gray-400  mt-1">
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
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Ignore
          </button>
          <button 
            onClick={() => handleAction('approve')}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              isPositive 
                ? 'bg-primary-600 text-primary-foreground hover:bg-primary-500' 
                : 'bg-orange-600 text-primary-foreground hover:bg-orange-500'
            }`}
          >
            {isProcessing ? 'Applying...' : <><Check size={18} /> Apply Change</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
