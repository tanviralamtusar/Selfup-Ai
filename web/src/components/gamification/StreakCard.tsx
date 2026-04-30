'use client'

import { motion } from 'framer-motion'
import { Shield, TrendingUp, Plus, Loader2, AlertTriangle, Calendar, Zap } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
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

/** Returns color classes based on current streak tier */
function getStreakTier(streak: number) {
  if (streak >= 30) return { icon: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/40', dot: 'bg-amber-400 shadow-amber-400/80' }
  if (streak >= 14) return { icon: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/40', dot: 'bg-purple-400 shadow-purple-400/80' }
  if (streak >= 7)  return { icon: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/40', dot: 'bg-emerald-400 shadow-emerald-400/80' }
  if (streak >= 3)  return { icon: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', glow: 'shadow-cyan-500/40', dot: 'bg-cyan-400 shadow-cyan-400/80' }
  if (streak >= 1)  return { icon: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/40', dot: 'bg-blue-400 shadow-blue-400/80' }
  return { icon: 'text-blue-900/20', border: 'border-blue-900/20', bg: 'bg-slate-900', glow: '', dot: 'bg-slate-700' }
}

export function StreakCard({ currentStreak, bestStreak, freezeCount, weeklyActivity = [false, false, false, false, false, false, false], lastDate, onPurchase, onViewHistory }: StreakCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const { session, updateProfile } = useAuthStore()

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const loggedToday = lastDate === today
  const isAtRisk = !loggedToday && lastDate === yesterday
  const isActive = currentStreak > 0

  const tier = getStreakTier(currentStreak)

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
      "relative group overflow-hidden rounded-[2rem] bg-slate-950/80 backdrop-blur-xl p-4 border transition-all duration-500 shadow-2xl h-full flex flex-col justify-between",
      isAtRisk ? "border-rose-500/30 shadow-rose-500/5" : "border-blue-500/20 shadow-blue-500/5"
    )}>
      {/* Background Glow */}
      <div className={cn(
        "absolute -top-20 -right-20 w-48 h-48 blur-[60px] rounded-full transition-colors duration-1000 opacity-20",
        isAtRisk ? "bg-rose-500" : isActive ? "bg-blue-500" : "bg-slate-800"
      )} />

      {/* Top: Streak Number + Icon */}
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/60 system-text-glow">Active Streak</span>
            {isActive && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className={cn("w-1.5 h-1.5 rounded-full shadow-lg", isAtRisk ? "bg-rose-500 shadow-rose-500/80" : tier.dot)} 
              />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              "text-4xl font-black tracking-tighter tabular-nums transition-colors duration-500 italic system-text-glow",
              isAtRisk ? "text-rose-500" : isActive ? "text-blue-50" : "text-blue-900/40"
            )}>
              {currentStreak}
            </span>
            <span className="text-lg font-black text-blue-400/20 uppercase tracking-widest italic">Days</span>
          </div>
        </div>

        <motion.div 
          animate={isActive ? { 
            scale: [1, 1.05, 1],
            boxShadow: isAtRisk 
              ? ["0 0 10px rgba(244,63,94,0.3)", "0 0 20px rgba(244,63,94,0.6)", "0 0 10px rgba(244,63,94,0.3)"] 
              : [`0 0 10px rgba(100,100,255,0.3)`, `0 0 20px rgba(100,100,255,0.6)`, `0 0 10px rgba(100,100,255,0.3)`]
          } : {}}
          transition={{ repeat: Infinity, duration: isAtRisk ? 1 : 3 }}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500",
            isAtRisk ? "bg-rose-500/10 text-rose-500 border-rose-500/50" : tier.bg, !isAtRisk && tier.icon, !isAtRisk && tier.border
          )}
        >
          {isAtRisk ? <AlertTriangle size={28} /> : <Zap size={28} className={cn(isActive && "system-text-glow")} fill={isActive ? "currentColor" : "none"} />}
        </motion.div>
      </div>

      {/* Weekly Activity Tracker */}
      <div className="mt-3 space-y-2 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/40 flex items-center gap-1.5">
            <Calendar size={10} /> Data Sync
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest text-blue-400/60">System Log</span>
        </div>
        <div className="flex justify-between items-center gap-1.5">
          {days.map((day, i) => (
            <div key={i} className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black transition-all border",
              weeklyActivity[i] 
                ? "bg-blue-500/20 text-blue-100 border-blue-400/50 shadow-[0_0_8px_rgba(59,130,246,0.2)]" 
                : "bg-slate-900/50 text-blue-900/40 border-blue-900/20"
            )}>
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-3 grid grid-cols-2 gap-3 relative z-10">
        <div className="space-y-1 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div className="flex items-center gap-1.5 text-blue-400/40 uppercase tracking-widest text-[8px] font-black">
            <TrendingUp size={10} /> Peak Output
          </div>
          <p className="text-base font-black text-blue-100 tabular-nums italic">{bestStreak} <span className="text-[9px] text-blue-400/20 uppercase not-italic">Days</span></p>
        </div>

        <div className="space-y-1 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div className="flex items-center gap-1.5 text-blue-400/40 uppercase tracking-widest text-[8px] font-black">
            <Shield size={10} /> Buffer Count
          </div>
          <div className="flex items-center justify-between">
            <p className="text-base font-black text-blue-100 tabular-nums italic">{freezeCount}</p>
            <button 
              onClick={handlePurchaseFreeze}
              disabled={isPurchasing}
              className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center transition-all hover:bg-blue-500/40 hover:text-blue-100 active:scale-95 disabled:opacity-50 border border-blue-400/30"
              title="Buy Streak Freeze (100 AiC)"
              aria-label="Buy Streak Freeze"
            >
              {isPurchasing ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
