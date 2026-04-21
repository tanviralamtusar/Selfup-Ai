'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Sparkles, X, Zap } from 'lucide-react'
import { useEffect } from 'react'

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
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-surface-container-low border border-amber-500/30 rounded-[2rem] p-8 overflow-hidden text-center shadow-2xl shadow-amber-500/20"
          >
            {/* Background Glows */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500/20 blur-[80px] rounded-full pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* Icon Container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, delay: 0.1 }}
              className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <div className="relative w-full h-full bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center shadow-inner border-[4px] border-surface-container-low">
                <Trophy size={48} className="text-white drop-shadow-md" />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2 w-10 h-10 bg-surface-container-low rounded-full flex items-center justify-center shadow-lg border border-amber-500/30"
              >
                <Sparkles size={20} className="text-amber-400" />
              </motion.div>
            </motion.div>

            {/* Text Content */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-on-surface font-headline tracking-tighter mb-2"
            >
              Level Up!
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-on-surface-variant mb-8"
            >
              You've reached <strong className="text-amber-400">Level {newLevel}</strong>. Your dedication is paying off.
            </motion.p>

            {/* Rewards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div className="p-4 rounded-3xl bg-surface-container border border-outline-variant/10">
                <div className="w-10 h-10 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
                  <Zap size={20} className="text-primary" />
                </div>
                <p className="text-xl font-black text-on-surface">{totalXp.toLocaleString()}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mt-1">Total XP</p>
              </div>
              <div className="p-4 rounded-3xl bg-surface-container border border-outline-variant/10">
                <div className="w-10 h-10 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center mb-2">
                  <Star size={20} className="text-amber-400" />
                </div>
                <p className="text-xl font-black text-amber-400">+{coinsReward}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mt-1">AiCoins</p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-sm hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
            >
              Claim Rewards
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
