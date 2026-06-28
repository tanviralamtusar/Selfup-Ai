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

function getStreakTier(streak: number) {
  if (streak >= 30) return { icon: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' }
  if (streak >= 14) return { icon: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' }
  if (streak >= 7)  return { icon: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' }
  if (streak >= 3)  return { icon: 'text-[#5db8a0]', border: 'border-[#5db8a0]/30', bg: 'bg-[#5db8a0]/10' }
  if (streak >= 1)  return { icon: 'text-primary', border: 'border-primary/30', bg: 'bg-primary/10' }
  return { icon: 'text-muted-foreground', border: 'border-border', bg: 'bg-muted' }
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
        toast.success('Streak Freeze purchased!')
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
    } catch {
      toast.error('Network error during purchase')
    } finally {
      setIsPurchasing(false)
    }
  }

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className={cn(
      "bg-card border rounded-xl p-4 h-full flex flex-col justify-between transition-colors",
      isAtRisk ? "border-destructive/40" : "border-border"
    )}>
      {/* Top: Streak Number + Icon */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">Active Streak</p>
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              "text-3xl font-medium tabular-nums transition-colors",
              isAtRisk ? "text-destructive" : isActive ? "text-foreground" : "text-muted-foreground"
            )}>
              {currentStreak}
            </span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>

        <motion.div
          animate={isActive ? { scale: [1, 1.04, 1] } : {}}
          transition={{ repeat: Infinity, duration: isAtRisk ? 1.5 : 3 }}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
            isAtRisk ? "bg-destructive/10 text-destructive border-destructive/30" : tier.bg, !isAtRisk && tier.icon, !isAtRisk && tier.border
          )}
        >
          {isAtRisk ? <AlertTriangle size={22} /> : <Zap size={22} fill={isActive ? "currentColor" : "none"} />}
        </motion.div>
      </div>

      {/* Weekly Activity Tracker */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar size={11} /> This Week
          </span>
        </div>
        <div className="flex justify-between items-center gap-1">
          {days.map((day, i) => (
            <div key={i} className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium transition-colors border",
              weeklyActivity[i]
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-border"
            )}>
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="space-y-1 p-2.5 rounded-lg bg-muted border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp size={11} /> Best
          </div>
          <p className="text-base font-semibold text-foreground tabular-nums">{bestStreak} <span className="text-xs text-muted-foreground font-normal">days</span></p>
        </div>

        <div className="space-y-1 p-2.5 rounded-lg bg-muted border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield size={11} /> Freezes
          </div>
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-foreground tabular-nums">{freezeCount}</p>
            <button
              onClick={handlePurchaseFreeze}
              disabled={isPurchasing}
              className="w-6 h-6 rounded-md bg-card border border-border text-muted-foreground flex items-center justify-center transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30 disabled:opacity-50"
              title="Buy Streak Freeze (100 AiC)"
            >
              {isPurchasing ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
