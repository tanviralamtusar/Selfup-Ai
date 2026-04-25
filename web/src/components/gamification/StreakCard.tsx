'use client'

import { motion } from 'framer-motion'
import { Flame, Shield, TrendingUp, Plus, Loader2, AlertTriangle, Calendar, ChevronRight, Zap } from 'lucide-react'
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
      "relative group overflow-hidden rounded-[2rem] bg-slate-950/80 backdrop-blur-xl p-6 border transition-all duration-500 shadow-2xl",
      isAtRisk ? "border-rose-500/30 shadow-rose-500/5" : "border-blue-500/20 shadow-blue-500/5"
    )}>
      {/* Background Glow */}
      <div className={cn(
        "absolute -top-24 -right-24 w-64 h-64 blur-[80px] rounded-full transition-colors duration-1000 opacity-20",
        isAtRisk ? "bg-rose-500" : isActive ? "bg-blue-500" : "bg-slate-800"
      )} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/60 system-text-glow">Active Streak</span>
            {isActive && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className={cn(
                  "w-1.5 h-1.5 rounded-full shadow-lg",
                  isAtRisk ? "bg-rose-500 shadow-rose-500/80" : "bg-blue-400 shadow-blue-400/80"
                )} 
              />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-5xl font-black tracking-tighter tabular-nums transition-colors duration-500 italic system-text-glow",
              isAtRisk ? "text-rose-500" : isActive ? "text-blue-50" : "text-blue-900/40"
            )}>
              {currentStreak}
            </span>
            <span className="text-xl font-black text-blue-400/20 uppercase tracking-widest italic">Days</span>
          </div>
        </div>

        <motion.div 
          animate={isActive ? { 
            scale: [1, 1.05, 1],
            boxShadow: isAtRisk ? ["0 0 10px rgba(244,63,94,0.3)", "0 0 20px rgba(244,63,94,0.6)", "0 0 10px rgba(244,63,94,0.3)"] : ["0 0 10px rgba(59,130,246,0.3)", "0 0 20px rgba(59,130,246,0.6)", "0 0 10px rgba(59,130,246,0.3)"]
          } : {}}
          transition={{ repeat: Infinity, duration: isAtRisk ? 1 : 3 }}
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500",
            isAtRisk ? "bg-rose-500/10 text-rose-500 border-rose-500/50" :
            isActive 
              ? "bg-blue-500/10 text-blue-400 border-blue-500/50" 
              : "bg-slate-900 text-blue-900/20 border-blue-900/20"
          )}
        >
          {isAtRisk ? <AlertTriangle size={32} /> : <Zap size={32} className={cn(isActive && "system-text-glow")} />}
        </motion.div>
      </div>

      {/* Weekly Activity Tracker */}
      <div className="mt-8 space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/40 flex items-center gap-1.5">
            <Calendar size={10} /> Data Sync
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest text-blue-400/60">System Log</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          {days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all border",
                weeklyActivity[i] 
                  ? "bg-blue-500/20 text-blue-100 border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]" 
                  : "bg-slate-900/50 text-blue-900/40 border-blue-900/20"
              )}>
                {day}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
        <div className="space-y-1.5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div className="flex items-center gap-1.5 text-blue-400/40 uppercase tracking-widest text-[8px] font-black">
            <TrendingUp size={10} /> Peak Output
          </div>
          <p className="text-lg font-black text-blue-100 tabular-nums italic">{bestStreak} <span className="text-[10px] text-blue-400/20 uppercase not-italic">Days</span></p>
        </div>

        <div className="space-y-1.5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div className="flex items-center gap-1.5 text-blue-400/40 uppercase tracking-widest text-[8px] font-black">
            <Shield size={10} /> Buffer Count
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-black text-blue-100 tabular-nums italic">{freezeCount}</p>
            <button 
              onClick={handlePurchaseFreeze}
              disabled={isPurchasing}
              className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center transition-all hover:bg-blue-500/40 hover:text-blue-100 active:scale-95 disabled:opacity-50 border border-blue-400/30"
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
           <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse">
             <AlertTriangle size={12} />
             <span className="text-[10px] font-black uppercase tracking-widest">Warning: Signal Weakening</span>
           </div>
        )}
        <div className="h-1.5 w-full bg-slate-900 rounded-sm overflow-hidden border border-blue-500/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: isActive ? "100%" : "0%" }}
            className={cn(
              "h-full transition-colors duration-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
              isAtRisk ? "bg-rose-500" : "bg-gradient-to-r from-blue-600 to-blue-400"
            )}
          />
        </div>
        <p className="text-[8px] font-black text-blue-400/20 uppercase tracking-[0.2em] text-center italic">
          {loggedToday ? "System Status: Stable" : isAtRisk ? "Synchronize now to prevent decay" : "Initialize system activity"}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-blue-500/10 flex justify-center relative z-10">
        <button 
          onClick={onViewHistory}
          className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/40 hover:text-blue-300 transition-colors flex items-center gap-1 group"
        >
          Archive Logs <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
