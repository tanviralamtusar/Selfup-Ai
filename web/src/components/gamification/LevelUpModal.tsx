'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Star, Sparkles, X, Zap, Trophy } from 'lucide-react'
import { useEffect } from 'react'
import { SystemFrame } from '../ui/SystemFrame'

interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  newLevel: number
  totalXp: number
  coinsReward: number
}

export function LevelUpModal({ isOpen, onClose, newLevel, totalXp, coinsReward }: LevelUpModalProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-visible"
          >
            <SystemFrame title="System Notification" className="w-full">
              <button
                onClick={onClose}
                className="absolute top-0 right-0 p-2 rounded-full hover:bg-primary/10 text-primary transition-colors z-50"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                {/* Icon Container */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                  className="relative w-20 h-20 mx-auto mb-8 flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-primary/15 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-full h-full border-2 border-border rounded-full flex items-center justify-center bg-muted">
                    <AlertCircle size={40} className="text-primary" />
                  </div>
                </motion.div>

                {/* Text Content */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4 mb-10"
                >
                  <h2 className="text-2xl  text-foreground ">
                    Level Up Accomplished
                  </h2>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                  <p className="text-foreground/80/80 font-medium tracking-wide">
                    You have acquired the qualifications to reach <br />
                    <span className="text-primary  text-lg">Level {newLevel}</span>. 
                    <br />Will you accept the new strength?
                  </p>
                </motion.div>

                {/* Rewards Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-4 mb-10"
                >
                  <div className="p-4 bg-muted border border-border rounded-xl group/reward">
                    <div className="w-10 h-10 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-2 group-hover/reward:scale-110 transition-transform">
                      <Zap size={20} className="text-primary" fill="currentColor" />
                    </div>
                    <p className="text-xl  text-foreground tabular-nums">{totalXp.toLocaleString()}</p>
                    <p className="text-[10px]  text-primary/40 mt-1">Total XP</p>
                  </div>
                  <div className="p-4 bg-muted border border-border rounded-xl group/reward">
                    <div className="w-10 h-10 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-2 group-hover/reward:scale-110 transition-transform">
                      <img src="/coin.png" alt="AiCoins" className="w-6 h-6 object-contain" />
                    </div>
                    <p className="text-xl  text-primary tabular-nums">+{coinsReward}</p>
                    <div className="mt-1 flex items-center justify-center gap-1.5 opacity-40">
                      <img src="/coin.png" alt="AiCoins" className="w-3 h-3 object-contain" />
                      <span className="text-[10px]  text-primary">AiCoins</span>
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={onClose}
                  className="group relative w-full py-4 overflow-hidden rounded-xl border border-border bg-primary/10 transition-all hover:bg-primary/15 active:scale-95"
                >
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-foreground   text-sm">
                    Accept Rewards
                  </span>
                </motion.button>
              </div>
            </SystemFrame>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
