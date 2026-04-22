'use client'

import { motion } from 'framer-motion'
import { Flame, Shield, TrendingUp, Plus, Loader2, AlertTriangle, Calendar, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn, formatNumber } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface StreakCardProps {
  currentStreak: number
  bestStreak: number
  freezeCount: number
  weeklyActivity?: boolean[]
  lastDate?: string | null
  onPurchase?: () => void
  onViewHistory?: () => void
}

export function StreakCard({ currentStreak, bestStreak, freezeCount, weeklyActivity = [false, false, false, false, false, false, false], lastDate, onPurchase, onViewHistory }: StreakCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { session, updateProfile } = useAuthStore()

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const loggedToday = lastDate === today
  const isAtRisk = !loggedToday && lastDate === yesterday
  const isActive = currentStreak > 0

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

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className={cn(
      "relative group overflow-hidden rounded-[2rem] bg-surface-container-low p-6 border transition-all duration-500 shadow-2xl",
      isAtRisk ? "border-red-500/30 shadow-red-500/5" : "border-outline-variant/10 hover:shadow-orange-500/5"
    )}>
      {/* Background Glow */}
      <div className={cn(
        "absolute -top-24 -right-24 w-64 h-64 blur-[80px] rounded-full transition-colors duration-1000",
        isAtRisk ? "bg-red-500/10" : isActive ? "bg-orange-500/10" : "bg-surface-container-highest/20"
      )} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60">Active Streak</span>
            {isActive && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className={cn(
                  "w-1.5 h-1.5 rounded-full shadow-lg",
                  isAtRisk ? "bg-red-500 shadow-red-500/80" : "bg-orange-500 shadow-orange-500/80"
                )} 
              />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-5xl font-black tracking-tighter tabular-nums transition-colors duration-500",
              isAtRisk ? "text-red-500" : isActive ? "text-on-surface" : "text-on-surface-variant/40"
            )}>
              {currentStreak}
            </span>
            <span className="text-xl font-black text-on-surface-variant/30">Days</span>
          </div>
        </div>

        <motion.div 
          animate={isActive ? { 
            scale: [1, 1.05, 1],
            rotate: isAtRisk ? [0, 5, -5, 0] : [0, 2, -2, 0]
          } : {}}
          transition={{ repeat: Infinity, duration: isAtRisk ? 1 : 3 }}
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500",
            isAtRisk ? "bg-red-500 text-white shadow-red-500/20" :
            isActive 
              ? "bg-orange-500 text-white shadow-orange-500/20" 
              : "bg-surface-container-highest text-on-surface-variant/20"
          )}
        >
          {isAtRisk ? <AlertTriangle size={32} /> : <Flame size={32} fill={isActive ? "currentColor" : "none"} />}
        </motion.div>
      </div>

      {/* Weekly Activity Tracker */}
      <div className="mt-8 space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 flex items-center gap-1.5">
            <Calendar size={10} /> Weekly Activity
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">This Week</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          {days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all",
                weeklyActivity[i] 
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                  : "bg-surface-container-highest/50 text-on-surface-variant/20 border border-outline-variant/5"
              )}>
                {day}
              </div>
              {weeklyActivity[i] && (
                <motion.div layoutId="active-indicator" className="w-1 h-1 rounded-full bg-orange-500/40" />
              )}
            </div>
          ))}
        </div>
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

      {/* Progress Bar */}
      <div className="mt-6 space-y-1.5 relative z-10">
        {isAtRisk && (
           <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
             <AlertTriangle size={12} />
             <span className="text-[10px] font-black uppercase tracking-widest">Streak at risk! Log now.</span>
           </div>
        )}
        <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: isActive ? "100%" : "0%" }}
            className={cn(
              "h-full transition-colors duration-500",
              isAtRisk ? "bg-red-500" : "bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
            )}
          />
        </div>
        <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest text-center italic">
          {loggedToday ? "Streak safe for today! ✨" : isAtRisk ? "Warning: Missed yesterday!" : "Log an activity to start a streak"}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-outline-variant/5 flex justify-center relative z-10">
        <button 
          onClick={onViewHistory}
          className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 hover:text-primary transition-colors flex items-center gap-1 group"
        >
          View Detailed History <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
