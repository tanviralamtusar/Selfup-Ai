'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, ClipboardList, Map, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Action {
  type: string;
  payload: any;
}

interface ActionWidgetProps {
  action: Action;
  className?: string;
}

export function ActionWidget({ action, className }: ActionWidgetProps) {
  switch (action.type) {
    case 'fitness_plan_generate':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn("mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 shadow-lg", className)}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-green-400">
              <Dumbbell size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-green-400 mb-1">Fitness Protocol Generated!</h4>
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                Your custom fitness plan is currently being finalized. Head over to the Fitness Dashboard to review and activate it.
              </p>
              <Link 
                href="/fitness" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-semibold transition-colors border border-green-500/30"
              >
                Review Plan <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>
      );

    case 'fitness_interview_start':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn("mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-lg", className)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
              <ClipboardList size={20} />
            </div>
            <div>
              <h4 className="font-bold text-blue-400">Fitness Interview Active</h4>
              <p className="text-sm text-gray-300">
                Answer my questions above so I can design your perfect physical vessel upgrade.
              </p>
            </div>
          </div>
        </motion.div>
      );

    case 'create_roadmap':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn("mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-lg", className)}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400">
              <Map size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-purple-400 mb-1">Skill Roadmap Created</h4>
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                A new learning roadmap has been generated based on your goals.
              </p>
              <Link 
                href="/skills" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-semibold transition-colors border border-purple-500/30"
              >
                View Skills <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>
      );

    default:
      return null;
  }
}
