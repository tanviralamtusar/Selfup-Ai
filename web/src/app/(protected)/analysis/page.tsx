'use client'

import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Target, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Calendar,
  ChevronRight,
  Brain,
  Star,
  Clock,
  Layout
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'
import { cn, formatNumber } from '@/lib/utils'

const containerAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } },
}

interface ActivityData {
  id: string
  type: string
  title: string
  pillar: string | null
  xp_earned: number
  timestamp: string
}

export default function AnalysisPage() {
  const { profile, session } = useAuthStore()
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (session?.access_token) {
      fetchActivities()
    }
  }, [session])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/user/activities', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch (err) {
      console.error('Failed to fetch activities', err)
    } finally {
      setLoading(false)
    }
  }

  // 1. Trend Data: XP per day (last 7 days)
  const trendData = useMemo(() => {
    const days = 7
    const result: Record<string, number> = {}
    
    // Initialize last 7 days
    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      result[d.toISOString().split('T')[0]] = 0
    }

    activities.forEach(act => {
      const date = act.timestamp.split('T')[0]
      if (result[date] !== undefined) {
        result[date] += act.xp_earned
      }
    })

    return Object.entries(result)
      .map(([date, xp]) => ({ 
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), 
        xp 
      }))
      .reverse()
  }, [activities])

  // 2. Pillar Distribution
  const pillarData = useMemo(() => {
    const pillars: Record<string, number> = {
      Fitness: 0,
      Skills: 0,
      Habits: 0,
      Quests: 0,
      Social: 0,
      General: 0
    }

    activities.forEach(act => {
      const p = act.pillar || 'General'
      const key = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
      if (pillars[key] !== undefined) {
        pillars[key] += act.xp_earned
      } else {
        pillars['General'] += act.xp_earned
      }
    })

    return Object.entries(pillars).map(([name, value]) => ({ name, value }))
  }, [activities])

  // 3. Activity Type Distribution
  const typeData = useMemo(() => {
    const types: Record<string, number> = {}
    activities.forEach(act => {
      types[act.type] = (types[act.type] || 0) + 1
    })
    return Object.entries(types).map(([name, value]) => ({ name, value }))
  }, [activities])

  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] italic">Accessing Neural Patterns...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerAnim}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Header Section */}
      <motion.div variants={itemAnim} className="relative group">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-[2.5rem] pointer-events-none" />
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950/80 backdrop-blur-xl p-6 md:p-10 border border-blue-500/20 shadow-2xl">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-blue-400/30" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-blue-400/30" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400/80 italic">Cognitive Analysis Engine</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-blue-50 font-headline italic uppercase system-text-glow">System Analysis</h1>
              <p className="text-sm text-blue-300/60 max-w-md font-medium">Neural performance tracking and behavioral patterns for User ID: {profile?.id?.slice(0, 8)}...</p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-slate-900/80 border border-blue-500/20 px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-[10px] font-black text-blue-500/40 uppercase tracking-widest mb-1">Sync Index</span>
                <span className="text-2xl font-black text-blue-100 italic">94.2%</span>
              </div>
              <div className="bg-slate-900/80 border border-blue-500/20 px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-[10px] font-black text-blue-500/40 uppercase tracking-widest mb-1">Stability</span>
                <span className="text-2xl font-black text-emerald-400 italic">NOMINAL</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* XP Trend Chart */}
        <motion.div variants={itemAnim} className="lg:col-span-8 bg-slate-950/40 backdrop-blur-xl border border-blue-500/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={120} className="text-blue-500" />
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Activity size={18} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-blue-50 uppercase tracking-widest italic">XP Growth Pattern</h3>
                <p className="text-[9px] text-blue-500/60 font-bold uppercase tracking-tighter mt-0.5">Last 7 Operational Cycles</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-blue-100 italic system-text-glow">+{trendData.reduce((acc, d) => acc + d.xp, 0)} XP</p>
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Growth Detected</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 900, fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="xp" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorXp)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Pillar Breakdown (Radar Chart) */}
        <motion.div variants={itemAnim} className="lg:col-span-4 bg-slate-950/40 backdrop-blur-xl border border-blue-500/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap size={18} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-blue-50 uppercase tracking-widest italic">Core Pillars</h3>
              <p className="text-[9px] text-blue-500/60 font-bold uppercase tracking-tighter mt-0.5">Attributes Distribution</p>
            </div>
          </div>

          <div className="h-[300px] w-full flex items-center justify-center">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={pillarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar
                    name="XP"
                    dataKey="value"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.4}
                    animationDuration={1500}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Activity Distribution */}
        <motion.div variants={itemAnim} className="lg:col-span-4 bg-slate-950/40 backdrop-blur-xl border border-blue-500/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BarChart3 size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-blue-50 uppercase tracking-widest italic">Execution Type</h3>
              <p className="text-[9px] text-blue-500/60 font-bold uppercase tracking-tighter mt-0.5">Task Volume Distribution</p>
            </div>
          </div>

          <div className="h-[200px] w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 mt-4">
            {typeData.map((type, idx) => (
              <div key={type.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[10px] font-black text-blue-100/60 uppercase tracking-widest">{type.name}</span>
                </div>
                <span className="text-[10px] font-black text-blue-50">{type.value} items</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Insights */}
        <motion.div variants={itemAnim} className="lg:col-span-8 bg-slate-950/40 backdrop-blur-xl border border-blue-500/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-blue-50 uppercase tracking-widest italic">AI Core Insights</h3>
              <p className="text-[9px] text-blue-500/60 font-bold uppercase tracking-tighter mt-0.5">Behavioral Pattern Recognition</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/10 space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-400" />
                <span className="text-[10px] font-black text-blue-50 uppercase tracking-widest">Efficiency Window</span>
              </div>
              <p className="text-xs text-blue-100/80 leading-relaxed italic">
                Your highest performance is currently localized between <span className="text-blue-400 font-black">09:00 - 11:30</span>. 
                Focus-intensive tasks should be prioritized during this window for maximum sync.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/10 space-y-3">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-cyan-400" />
                <span className="text-[10px] font-black text-blue-50 uppercase tracking-widest">Pillar Imbalance</span>
              </div>
              <p className="text-xs text-blue-100/80 leading-relaxed italic">
                Detected a <span className="text-cyan-400 font-black">15% lag</span> in the "Skills" pillar compared to "Habits". 
                Recommend initiating a learning session to stabilize neural equilibrium.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/10 space-y-3">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-400" />
                <span className="text-[10px] font-black text-blue-50 uppercase tracking-widest">Consistency Rating</span>
              </div>
              <p className="text-xs text-blue-100/80 leading-relaxed italic">
                Current streak consistency is at <span className="text-amber-400 font-black">8.4/10</span>. 
                User stability has increased since the last session.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/10 space-y-3">
              <div className="flex items-center gap-2">
                <Layout size={14} className="text-rose-400" />
                <span className="text-[10px] font-black text-blue-50 uppercase tracking-widest">Recommended Protocol</span>
              </div>
              <p className="text-xs text-blue-100/80 leading-relaxed italic">
                Integration of a <span className="text-rose-400 font-black">"Micro-Sprint"</span> protocol could resolve minor productivity friction detected in the afternoon.
              </p>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Activity Timeline Simplified */}
      <motion.section variants={itemAnim} className="bg-slate-950/40 backdrop-blur-xl border border-blue-500/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Calendar size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-blue-50 uppercase tracking-widest italic">Operational Log</h3>
              <p className="text-[9px] text-blue-500/60 font-bold uppercase tracking-tighter mt-0.5">Recent System Events</p>
            </div>
          </div>
          <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1 hover:text-blue-300 transition-colors italic">
            Full Archives <ChevronRight size={10} />
          </button>
        </div>

        <div className="space-y-3">
          {activities.slice(0, 5).map((act) => (
            <div key={act.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/40 border border-blue-500/5 group hover:border-blue-500/20 transition-all">
              <div className={cn(
                "w-2 h-2 rounded-full",
                act.type === 'habit' ? 'bg-blue-500' :
                act.type === 'workout' ? 'bg-emerald-500' :
                act.type === 'skill' ? 'bg-cyan-500' :
                'bg-blue-400'
              )} />
              <div className="flex-1">
                <p className="text-xs font-black text-blue-50 uppercase tracking-wide italic">{act.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-widest italic">{act.type}</span>
                  <div className="w-1 h-1 rounded-full bg-blue-500/20" />
                  <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-widest">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-blue-400 system-text-glow">+{act.xp_earned} XP</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
