'use client'

import { motion } from 'framer-motion'
import { Flame, Shield, TrendingUp, Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cn, formatNumber } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface StreakCardProps {
  currentStreak: number
  bestStreak: number
  freezeCount: number
  onPurchase?: () => void
}

export function StreakCard({ currentStreak, bestStreak, freezeCount, onPurchase }: StreakCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const { session, updateProfile } = useAuthStore()

  const handlePurchaseFreeze = async () => {
    if (!session?.access_token) return
    setIsPurchasing(true)
    try {
      const res = await fetch('/api/user/streak-freeze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Streak Freeze purchased! 🧊')
        // Update local profile state
        if (data.newBalance !== undefined && data.newFreezeCount !== undefined) {
          updateProfile({ 
            ai_coins: data.newBalance, 
            streak_freeze_count: data.newFreezeCount 
          })
        }
        onPurchase?.()
      } else {
        toast.error(data.error || 'Failed to purchase freeze')
      }
    } catch (err) {
      toast.error('Network error during purchase')
    } finally {
      setIsPurchasing(false)
    }
  }

  const isActive = currentStreak > 0

  return (
    <div className="relative group overflow-hidden rounded-[2rem] bg-surface-container-low p-6 border border-outline-variant/10 shadow-2xl transition-all duration-500 hover:shadow-orange-500/5">
      {/* Background Glow */}
      <div className={cn(
        "absolute -top-24 -right-24 w-64 h-64 blur-[80px] rounded-full transition-colors duration-1000",
        isActive ? "bg-orange-500/10" : "bg-surface-container-highest/20"
      )} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60">Active Streak</span>
            {isActive && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" 
              />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-5xl font-black tracking-tighter tabular-nums transition-colors duration-500",
              isActive ? "text-on-surface" : "text-on-surface-variant/40"
            )}>
              {currentStreak}
            </span>
            <span className="text-xl font-black text-on-surface-variant/30">Days</span>
          </div>
        </div>

        <motion.div 
          animate={isActive ? { 
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          } : {}}
          transition={{ repeat: Infinity, duration: 3 }}
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500",
            isActive 
              ? "bg-orange-500 text-white shadow-orange-500/20" 
              : "bg-surface-container-highest text-on-surface-variant/20"
          )}
        >
          <Flame size={32} fill={isActive ? "currentColor" : "none"} />
        </motion.div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
        <div className="space-y-1.5 p-3 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/5">
          <div className="flex items-center gap-1.5 text-on-surface-variant/60 uppercase tracking-widest text-[8px] font-black">
            <TrendingUp size={10} /> Personal Best
          </div>
          <p className="text-lg font-black text-on-surface tabular-nums">{bestStreak} <span className="text-[10px] text-on-surface-variant/40 uppercase">Days</span></p>
        </div>

        <div className="space-y-1.5 p-3 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/5">
          <div className="flex items-center gap-1.5 text-on-surface-variant/60 uppercase tracking-widest text-[8px] font-black">
            <Shield size={10} /> Freezes
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-black text-on-surface tabular-nums">{freezeCount}</p>
            <button 
              onClick={handlePurchaseFreeze}
              disabled={isPurchasing}
              className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-all hover:bg-primary hover:text-on-primary active:scale-95 disabled:opacity-50"
              title="Buy Streak Freeze (100 AiC)"
            >
              {isPurchasing ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar (Visual only for now, representing health of streak) */}
      <div className="mt-6 space-y-1.5 relative z-10">
        <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: isActive ? "100%" : "0%" }}
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
          />
        </div>
        <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest text-center italic">
          {isActive ? "Keep the fire burning!" : "Log an activity to start a streak"}
        </p>
      </div>
    </div>
  )
}
