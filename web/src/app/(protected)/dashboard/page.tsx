'use client'

import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import Link from 'next/link'
import { cn, formatNumber } from '@/lib/utils'
import { xpToNextLevel } from '@/constants/gamification'
import { motion } from 'framer-motion'
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
  Sparkles
} from 'lucide-react'

const containerAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

function Gauge({ percent, colorClass, label, title }: { percent: number, colorClass: string, label: string, title: string }) {
  const dasharray = 364.4;
  const dashoffset = dasharray - (dasharray * percent) / 100;
  
  return (
    <div className="flex flex-col items-center gap-6 group">
      <div className="relative w-32 h-32 md:w-36 md:h-36 flex items-center justify-center p-2">
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
            strokeWidth="8"
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
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl md:text-3xl font-black text-on-surface leading-none">{Math.round(percent)}%</span>
          <span className="text-[9px] md:text-[11px] uppercase font-black text-on-surface-variant/60 tracking-[0.2em] mt-1.5">{label}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-black text-on-surface-variant group-hover:text-primary uppercase tracking-widest transition-colors mb-0.5">{title}</p>
        <div className="h-0.5 w-8 bg-primary/20 mx-auto rounded-full group-hover:w-12 transition-all" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile)

  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpNeeded = profile?.xp_to_next_level ?? xpToNextLevel(level)
  const xpPercent = xpNeeded > 0 ? Math.min((xp / xpNeeded) * 100, 100) : 0
  const coins = profile?.ai_coins ?? 20
  const displayName = profile?.display_name || profile?.username || 'Pathfinder'

  // Dummy values for Health and Mana to match visual requirements
  const health = 27; const maxHealth = 50; const healthPct = (health / maxHealth) * 100;
  const mana = 82; const maxMana = 100; const manaPct = (mana / maxMana) * 100;

  return (
    <motion.div
      variants={containerAnim}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-12"
    >
      {/* ─── RPG Profile Header ─── */}
      <motion.section variants={itemAnim} className="relative overflow-hidden rounded-[3rem] bg-surface-container-low p-8 md:p-12 border border-outline-variant/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="relative group">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-[2.5rem] overflow-hidden ring-4 ring-primary/10 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-primary/20">
              <img 
                className="w-full h-full object-cover" 
                alt="Avatar" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2EIJrkG8GjWUaqksGrM3EhEN0QvYFC1AjRMhRnDPcUV38hJ22CC5uj95ZGQX5yQ1DfC_bIT00J40cE4gpVSgmP8AHdmwLMl5QY-rOqjeY-LAM4tNNQ6vTRax-BTbFP7NEs-8GbXqnPRLNQI9RJygYPAzSIDe7AQJdRVKOD9wo-KPnuqN5q4G8_bIPOJUlkL3pTdX7jx6ijSjDwpfOxLT21Wf3hKeUxgr3BvX5tIqydhmNmHA1IUE89vEpZeP1bbP7tSbEkcq98j5j"
              />
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary font-black px-6 py-2 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl ring-4 ring-surface-container-low">
              LVL {level}
            </div>
          </div>
          
          <div className="flex-1 w-full space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Sparkles size={14} className="text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/60">Character Profile</p>
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-on-surface font-headline leading-none">{displayName}</h1>
              </div>
              <div className="text-center md:text-right bg-surface-container-highest/20 px-8 py-4 rounded-[2rem] border border-outline-variant/10 backdrop-blur-sm group hover:border-primary/30 transition-colors">
                <span className="text-[10px] font-black text-tertiary-fixed-dim uppercase tracking-[0.3em] block mb-1">AiCoins</span>
                <span className="text-4xl font-black text-on-surface tracking-tighter tabular-nums">{formatNumber(coins)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Health (Vitality) */}
              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-error flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                    Vitality
                  </span>
                  <span className="text-xs font-black text-on-surface tabular-nums">{health} <span className="text-on-surface-variant/40">/</span> {maxHealth}</span>
                </div>
                <div className="h-5 w-full bg-surface-container-lowest rounded-full p-1.5 border border-outline-variant/10 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${healthPct}%` }} 
                    className="h-full bg-gradient-to-r from-error to-error-container rounded-full shadow-[0_0_20px_rgba(255,110,132,0.4)]" 
                  />
                </div>
              </div>
              
              {/* Experience (Progression) */}
              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Progression
                  </span>
                  <span className="text-xs font-black text-on-surface tabular-nums">{formatNumber(xp)} <span className="text-on-surface-variant/40">/</span> {formatNumber(xpNeeded)}</span>
                </div>
                <div className="h-5 w-full bg-surface-container-lowest rounded-full p-1.5 border border-outline-variant/10 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${xpPercent}%` }} 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_20px_rgba(174,162,255,0.4)]" 
                  />
                </div>
              </div>

              {/* Mana (Aura) */}
              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    Aura
                  </span>
                  <span className="text-xs font-black text-on-surface tabular-nums">{mana} <span className="text-on-surface-variant/40">/</span> {maxMana}</span>
                </div>
                <div className="h-5 w-full bg-surface-container-lowest rounded-full p-1.5 border border-outline-variant/10 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${manaPct}%` }} 
                    className="h-full bg-gradient-to-r from-secondary to-secondary-container rounded-full shadow-[0_0_20px_rgba(168,140,251,0.4)]" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Main 4-Column Grid ─── */}
      <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column: Habits */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-3">
            <h2 className="text-[11px] font-black tracking-[3px] flex items-center gap-3 font-headline uppercase text-on-surface">
              <Bolt className="text-primary" size={16} /> Habits
            </h2>
            <button className="text-on-surface-variant/40 hover:text-primary transition-all hover:scale-110 active:scale-90">
              <PlusCircle size={20} />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Morning Exercise', xp: '+2.5 XP', color: 'primary' },
              { title: 'Healthy Eating', xp: '+1.2 XP', color: 'primary' }
            ].map(habit => (
              <div key={habit.title} className="group bg-surface-container-low hover:bg-surface-container-high p-2 rounded-[1.5rem] transition-all border border-outline-variant/10 shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-2">
                  <button className="w-11 h-11 flex items-center justify-center bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-on-primary transition-all active:scale-90">
                    <Plus size={18} />
                  </button>
                  <div className="flex-1 px-2">
                    <p className="text-sm font-black tracking-tight text-on-surface">{habit.title}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{habit.xp}</p>
                  </div>
                  <button className="w-11 h-11 flex items-center justify-center bg-error/5 text-error/40 rounded-xl hover:bg-error hover:text-on-error transition-all active:scale-90 opacity-0 group-hover:opacity-100">
                    <Minus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column: Dailies */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-3">
            <h2 className="text-[11px] font-black tracking-[3px] flex items-center gap-3 font-headline uppercase text-on-surface">
              <Calendar className="text-secondary" size={16} /> Dailies
            </h2>
            <button className="text-on-surface-variant/40 hover:text-secondary transition-all hover:scale-110 active:scale-90">
              <PlusCircle size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-5 bg-surface-container-low p-5 rounded-[1.5rem] border border-outline-variant/10 hover:bg-surface-container-high transition-all group cursor-pointer shadow-lg hover:-translate-y-1">
              <div className="w-7 h-7 rounded-xl border-2 border-outline-variant group-hover:border-secondary flex items-center justify-center transition-all group-hover:bg-secondary/10">
                <Check className="text-secondary opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" size={16} strokeWidth={3} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-on-surface">Read 20 Pages</p>
                <div className="w-full h-1.5 bg-surface-container-lowest rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-secondary h-full w-[40%] transition-all duration-700 shadow-[0_0_10px_rgba(168,140,251,0.5)]" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 bg-surface-container-low p-5 rounded-[1.5rem] border border-outline-variant/10 opacity-50 shadow-sm cursor-pointer grayscale group">
              <div className="w-7 h-7 rounded-xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/20">
                <Check className="text-on-secondary" size={16} strokeWidth={3} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-on-surface line-through decoration-on-surface-variant/40">Python Practice</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column: To-Dos */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-3">
            <h2 className="text-[11px] font-black tracking-[3px] flex items-center gap-3 font-headline uppercase text-on-surface">
              <CheckCircle className="text-tertiary-fixed-dim" size={16} /> To-Dos
            </h2>
            <button className="text-on-surface-variant/40 hover:text-tertiary-fixed-dim transition-all hover:scale-110 active:scale-90">
              <PlusCircle size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-surface-container-low p-6 rounded-[1.5rem] border border-outline-variant/10 hover:border-primary/30 transition-all shadow-lg hover:-translate-y-1 cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-error/5 blur-2xl rounded-full" />
              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="space-y-4">
                  <p className="text-sm font-black leading-snug text-on-surface group-hover:text-primary transition-colors">Complete Project Specs</p>
                  <span className="inline-flex px-3 py-1.5 rounded-xl bg-error/10 text-error text-[9px] font-black uppercase tracking-widest ring-1 ring-error/20">High Priority</span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center transition-all group-hover:border-primary">
                   <div className="w-2 h-2 rounded-sm bg-primary opacity-0 group-hover:opacity-20 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column: Rewards */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-3">
            <h2 className="text-[11px] font-black tracking-[3px] flex items-center gap-3 font-headline uppercase text-on-surface">
              <Trophy className="text-tertiary" size={16} /> Rewards
            </h2>
            <button className="text-on-surface-variant/40 hover:text-on-surface transition-all">
              <Filter size={18} />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { icon: Gamepad2, title: 'Gaming 1hr', cost: '150 AiC', color: 'text-primary' },
              { icon: Shield, title: 'Epic Shield', cost: '2,500 AiC', color: 'text-secondary' }
            ].map(reward => (
              <div key={reward.title} className="group relative overflow-hidden bg-surface-container-low p-5 rounded-[1.5rem] border border-outline-variant/10 hover:bg-surface-container-high transition-all flex items-center gap-5 shadow-lg hover:-translate-y-1 cursor-pointer">
                <div className={cn("w-14 h-14 rounded-2xl bg-surface-container-lowest flex items-center justify-center shadow-inner ring-1 ring-outline-variant/10 group-hover:scale-110 transition-transform", reward.color)}>
                  <reward.icon size={28} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black tracking-tight text-on-surface">{reward.title}</p>
                  <p className="text-xs font-black text-tertiary-fixed-dim uppercase tracking-widest">{reward.cost}</p>
                </div>
                <button className="px-4 py-2 bg-surface-container-highest/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all active:scale-95 shadow-md border border-outline-variant/10">Buy</button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Pillars of Mastery Section ─── */}
      <motion.section variants={itemAnim} className="bg-surface-container-low rounded-[3.5rem] p-10 md:p-14 border border-outline-variant/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 blur-[140px] rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-px bg-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Long-term Progression</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface font-headline leading-none">Pillars of Mastery</h2>
          </div>
          <Link href={ROUTES.SKILLS} className="px-8 py-4 bg-primary/10 text-primary rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-primary hover:text-on-primary transition-all group shadow-lg shadow-primary/5">
            Detailed Stats <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
          <Gauge percent={75} colorClass="text-primary" label="Strength" title="Physical Form" />
          <Gauge percent={60} colorClass="text-secondary" label="Intellect" title="Cognitive Skill" />
          <Gauge percent={90} colorClass="text-tertiary-fixed-dim" label="Spirit" title="Mental Fortitude" />
          <Gauge percent={30} colorClass="text-error" label="Charm" title="Social Impact" />
        </div>
      </motion.section>
    </motion.div>
  )
}
