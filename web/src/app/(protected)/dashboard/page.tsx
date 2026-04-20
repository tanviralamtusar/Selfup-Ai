'use client'

import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import Link from 'next/link'
import { cn, formatNumber } from '@/lib/utils'
import { xpToNextLevel } from '@/constants/gamification'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  PlusCircle, 
  Bolt, 
  Calendar, 
  CheckCircle, 
  Trophy, 
  Plus, 
  Minus, 
  Check,
  ArrowRight,
  Gamepad2,
  Shield,
  Filter,
  Sparkles,
  Flame,
  Loader2
} from 'lucide-react'

const containerAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any } },
}

function Gauge({ percent, colorClass, label, title }: { percent: number, colorClass: string, label: string, title: string }) {
  const dasharray = 364.4;
  const dashoffset = dasharray - (dasharray * percent) / 100;
  
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center p-1.5">
        <svg 
          className="w-full h-full -rotate-90" 
          viewBox="0 0 128 128" 
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Track */}
          <circle 
            className="text-surface-container-highest/30" 
            cx="64" cy="64" r="58" 
            fill="transparent" 
            stroke="currentColor" 
            strokeWidth="6"
          />
          {/* Progress */}
          <motion.circle 
            className={cn('transition-all duration-1000', colorClass)} 
            cx="64" cy="64" r="58" 
            fill="transparent" 
            stroke="currentColor" 
            strokeDasharray={dasharray} 
            initial={{ strokeDashoffset: dasharray }}
            animate={{ strokeDashoffset: dashoffset }}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-lg md:text-xl font-black text-on-surface leading-none">{Math.round(percent)}%</span>
          <span className="text-[8px] md:text-[9px] uppercase font-black text-on-surface-variant/60 tracking-[0.2em] mt-0.5">{label}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-on-surface-variant group-hover:text-primary uppercase tracking-widest transition-colors mb-0.5">{title}</p>
        <div className="h-0.5 w-6 bg-primary/20 mx-auto rounded-full group-hover:w-10 transition-all" />
      </div>
    </div>
  )
}

interface Habit {
  id: string
  name: string
  pillar: string
  streak: number
  completed_today: boolean
}

export default function DashboardPage() {
  const { profile, session } = useAuthStore()

  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpNeeded = profile?.xp_to_next_level ?? xpToNextLevel(level)
  const xpPercent = xpNeeded > 0 ? Math.min((xp / xpNeeded) * 100, 100) : 0
  const coins = profile?.ai_coins ?? 20
  const displayName = profile?.display_name || profile?.username || 'Pathfinder'

  // Dummy values for Health and Mana to match visual requirements
  const health = 27; const maxHealth = 50; const healthPct = (health / maxHealth) * 100;
  const mana = 82; const maxMana = 100; const manaPct = (mana / maxMana) * 100;

  // Live habits
  const [habits, setHabits] = useState<Habit[]>([])
  const [loggingHabit, setLoggingHabit] = useState<string | null>(null)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  useEffect(() => {
    if (session?.access_token) fetchHabits()
  }, [session])

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits', { headers: headers() })
      if (res.ok) setHabits(await res.json())
    } catch { /* silently fail — habits are non-critical */ }
  }

  const handleLogHabit = async (habitId: string) => {
    setLoggingHabit(habitId)
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST', headers: headers()
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`+${data.xpEarned} XP — Habit logged! 🔥`)
        fetchHabits()
      } else if (res.status === 409) {
        toast.info('Already logged today!')
      }
    } catch { toast.error('Failed to log habit') }
    finally { setLoggingHabit(null) }
  }

  return (
    <motion.div
      variants={containerAnim}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-6"
    >
      {/* ─── RPG Profile Header ─── */}
      <motion.section variants={itemAnim} className="relative overflow-hidden rounded-[1.5rem] bg-surface-container-low p-5 md:p-6 border border-outline-variant/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col lg:flex-row items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-4 ring-primary/10 shadow-xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-primary/20">
              <img 
                className="w-full h-full object-cover" 
                alt="Avatar" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2EIJrkG8GjWUaqksGrM3EhEN0QvYFC1AjRMhRnDPcUV38hJ22CC5uj95ZGQX5yQ1DfC_bIT00J40cE4gpVSgmP8AHdmwLMl5QY-rOqjeY-LAM4tNNQ6vTRax-BTbFP7NEs-8GbXqnPRLNQI9RJygYPAzSIDe7AQJdRVKOD9wo-KPnuqN5q4G8_bIPOJUlkL3pTdX7jx6ijSjDwpfOxLT21Wf3hKeUxgr3BvX5tIqydhmNmHA1IUE89vEpZeP1bbP7tSbEkcq98j5j"
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-on-primary font-black px-3 py-1 rounded-lg text-[9px] uppercase tracking-[0.2em] shadow-lg ring-2 ring-surface-container-low whitespace-nowrap">
              LVL {level}
            </div>
          </div>
          
          <div className="flex-1 w-full space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-5">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1.5">
                  <Sparkles size={10} className="text-primary" />
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-on-surface-variant/60">Character Profile</p>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface font-headline leading-none">{displayName}</h1>
              </div>
              <div className="text-center md:text-right bg-surface-container-highest/20 px-5 py-2.5 rounded-xl border border-outline-variant/10 backdrop-blur-sm group hover:border-primary/30 transition-colors">
                <span className="text-[8px] font-black text-tertiary-fixed-dim uppercase tracking-[0.2em] block mb-0.5">AiCoins</span>
                <span className="text-xl font-black text-on-surface tracking-tighter tabular-nums">{formatNumber(coins)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Health (HP) */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    HP
                  </span>
                  <span className="text-[10px] font-black text-on-surface tabular-nums">{health} <span className="text-on-surface-variant/40">/</span> {maxHealth}</span>
                </div>
                <div className="h-3 w-full bg-surface-container-lowest rounded-full p-0.5 border border-outline-variant/10 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${healthPct}%` }} 
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                  />
                </div>
              </div>
              
              {/* Experience (XP) */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-400 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    XP
                  </span>
                  <span className="text-[10px] font-black text-on-surface tabular-nums">{formatNumber(xp)} <span className="text-on-surface-variant/40">/</span> {formatNumber(xpNeeded)}</span>
                </div>
                <div className="h-3 w-full bg-surface-container-lowest rounded-full p-0.5 border border-outline-variant/10 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${xpPercent}%` }} 
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.4)]" 
                  />
                </div>
              </div>

              {/* Mana (Mana) */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Mana
                  </span>
                  <span className="text-[10px] font-black text-on-surface tabular-nums">{mana} <span className="text-on-surface-variant/40">/</span> {maxMana}</span>
                </div>
                <div className="h-3 w-full bg-surface-container-lowest rounded-full p-0.5 border border-outline-variant/10 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${manaPct}%` }} 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.4)]" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Main 4-Column Grid ─── */}
      <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Column: Habits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[9px] font-black tracking-[2px] flex items-center gap-1.5 font-headline uppercase text-on-surface">
              <Bolt className="text-primary" size={12} /> Habits
            </h2>
            <Link href={ROUTES.TIME} className="text-on-surface-variant/40 hover:text-primary transition-all hover:scale-110 active:scale-90">
              <PlusCircle size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {habits.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-outline-variant/10 text-center">
                <p className="text-[10px] text-on-surface-variant/30 font-black uppercase tracking-widest">No habits yet</p>
                <Link href={ROUTES.TIME} className="text-[9px] text-primary font-black uppercase tracking-widest mt-1 block hover:underline">
                  Create one →
                </Link>
              </div>
            ) : habits.slice(0, 3).map(habit => (
              <div key={habit.id} className={cn(
                "group bg-surface-container-low hover:bg-surface-container-high p-2 rounded-2xl transition-all border shadow-sm hover:-translate-y-0.5",
                habit.completed_today ? 'border-tertiary-fixed-dim/20 opacity-70' : 'border-outline-variant/10'
              )}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => !habit.completed_today && handleLogHabit(habit.id)}
                    disabled={habit.completed_today || loggingHabit === habit.id}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90",
                      habit.completed_today
                        ? 'bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim cursor-default'
                        : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary'
                    )}
                  >
                    {loggingHabit === habit.id ? <Loader2 size={14} className="animate-spin" /> :
                     habit.completed_today ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                  <div className="flex-1 px-2">
                    <p className="text-xs font-black tracking-tight text-on-surface">{habit.name}</p>
                    <p className="text-[9px] text-primary font-black uppercase tracking-widest">+10 XP</p>
                  </div>
                  {habit.streak > 0 && (
                    <div className="flex items-center gap-1 pr-2">
                      <Flame size={12} className="text-orange-400" />
                      <span className="text-[10px] font-black text-orange-400">{habit.streak}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column: Dailies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[9px] font-black tracking-[2px] flex items-center gap-1.5 font-headline uppercase text-on-surface">
              <Calendar className="text-secondary" size={12} /> Dailies
            </h2>
            <button className="text-on-surface-variant/40 hover:text-secondary transition-all hover:scale-110 active:scale-90">
              <PlusCircle size={16} />
            </button>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/10 hover:bg-surface-container-high transition-all group cursor-pointer shadow-sm hover:-translate-y-0.5">
              <div className="w-4 h-4 rounded border text-outline border-outline-variant group-hover:border-secondary flex items-center justify-center transition-all group-hover:bg-secondary/10">
                <Check className="text-secondary opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" size={10} strokeWidth={3} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black text-on-surface">Read 20 Pages</p>
                <div className="w-full h-1 bg-surface-container-lowest rounded-full mt-1 overflow-hidden">
                  <div className="bg-secondary h-full w-[40%] transition-all duration-700 shadow-[0_0_10px_rgba(168,140,251,0.5)]" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/10 opacity-50 shadow-sm cursor-pointer grayscale group">
              <div className="w-4 h-4 rounded bg-secondary flex items-center justify-center shadow-md shadow-secondary/20">
                <Check className="text-on-secondary" size={10} strokeWidth={3} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black text-on-surface line-through decoration-on-surface-variant/40">Python Practice</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column: To-Dos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[9px] font-black tracking-[2px] flex items-center gap-1.5 font-headline uppercase text-on-surface">
              <CheckCircle className="text-tertiary-fixed-dim" size={12} /> To-Dos
            </h2>
            <button className="text-on-surface-variant/40 hover:text-tertiary-fixed-dim transition-all hover:scale-110 active:scale-90">
              <PlusCircle size={16} />
            </button>
          </div>
          <div className="space-y-2.5">
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all shadow-sm hover:-translate-y-0.5 cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-error/5 blur-xl rounded-full" />
              <div className="flex items-start justify-between gap-2.5 relative z-10">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-black leading-snug text-on-surface group-hover:text-primary transition-colors">Complete Project Specs</p>
                  <span className="inline-flex px-1.5 py-0.5 rounded-md bg-error/10 text-error text-[7px] font-black uppercase tracking-[0.2em] ring-1 ring-error/20">High Priority</span>
                </div>
                <div className="w-3.5 h-3.5 rounded-[3px] bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center transition-all group-hover:border-primary">
                   <div className="w-1 h-1 rounded-[2px] bg-primary opacity-0 group-hover:opacity-20 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column: Rewards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[9px] font-black tracking-[2px] flex items-center gap-1.5 font-headline uppercase text-on-surface">
              <Trophy className="text-tertiary" size={12} /> Rewards
            </h2>
            <button className="text-on-surface-variant/40 hover:text-on-surface transition-all">
              <Filter size={14} />
            </button>
          </div>
          <div className="space-y-2.5">
            {[
              { icon: Gamepad2, title: 'Gaming 1hr', cost: '150 AiC', color: 'text-primary' },
              { icon: Shield, title: 'Epic Shield', cost: '2,500 AiC', color: 'text-secondary' }
            ].map(reward => (
              <div key={reward.title} className="group relative overflow-hidden bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/10 hover:bg-surface-container-high transition-all flex items-center gap-3 shadow-sm hover:-translate-y-0.5 cursor-pointer">
                <div className={cn("w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shadow-inner ring-1 ring-outline-variant/10 group-hover:scale-110 transition-transform", reward.color)}>
                  <reward.icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black tracking-tight text-on-surface">{reward.title}</p>
                  <p className="text-[8px] font-black text-tertiary-fixed-dim uppercase tracking-widest">{reward.cost}</p>
                </div>
                <button className="px-2.5 py-1 bg-surface-container-highest/50 rounded-md text-[8px] font-black uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all active:scale-95 shadow-sm border border-outline-variant/10">Buy</button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Pillars of Mastery Section ─── */}
      <motion.section variants={itemAnim} className="bg-surface-container-low rounded-[1.5rem] p-6 md:p-8 border border-outline-variant/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 blur-[140px] rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-px bg-primary" />
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">Long-term Progression</p>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface font-headline leading-none">Pillars of Mastery</h2>
          </div>
          <Link href={ROUTES.SKILLS} className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 hover:bg-primary hover:text-on-primary transition-all group shadow-md shadow-primary/5">
            Detailed Stats <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-10">
          <Gauge percent={75} colorClass="text-primary" label="Strength" title="Physical Form" />
          <Gauge percent={60} colorClass="text-secondary" label="Intellect" title="Cognitive Skill" />
          <Gauge percent={90} colorClass="text-tertiary-fixed-dim" label="Spirit" title="Mental Fortitude" />
          <Gauge percent={30} colorClass="text-error" label="Charm" title="Social Impact" />
        </div>
      </motion.section>
    </motion.div>
  )
}
