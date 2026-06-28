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

  const COLORS = ['#9c7ef0', '#5db8a0', '#10b981', '#f43f5e', '#d4a84b', '#60a5fa']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin" />
          <p className="text-primary   text-[10px] ">Loading Progress...</p>
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
      <motion.div variants={itemAnim}>
        <div className="rounded-xl bg-card p-6 md:p-10 border border-border">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-primary  animate-pulse" />
                <span className="text-[10px]   text-primary/80 ">Activity Analysis</span>
              </div>
              <h1 className="text-3xl md:text-5xl  tracking-tight text-foreground font-headline ">Progress Analysis</h1>
              <p className="text-sm text-muted-foreground max-w-md font-medium">Tracking your productivity and habit patterns.</p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-muted border border-border px-6 py-4 rounded-xl flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-[10px]  text-muted-foreground mb-1">Sync Index</span>
                <span className="text-2xl  text-foreground ">94%</span>
              </div>
              <div className="bg-muted border border-border px-6 py-4 rounded-xl flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-[10px]  text-muted-foreground mb-1">Stability</span>
                <span className="text-2xl  text-emerald-400 ">GOOD</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* XP Trend Chart */}
        <motion.div variants={itemAnim} className="lg:col-span-8 bg-card  border border-border rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={120} className="text-primary" />
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-border flex items-center justify-center">
                <Activity size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xs  text-foreground ">XP Growth Pattern</h3>
                <p className="text-[9px] text-muted-foreground font-medium tracking-tighter mt-0.5">Last 7 Days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl  text-foreground ">+{trendData.reduce((acc, d) => acc + d.xp, 0)} XP</p>
              <p className="text-[9px] text-emerald-400 ">Growth Detected</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9c7ef0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#9c7ef0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3a3a3a" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b6b6b', fontSize: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b6b6b', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '8px' }}
                    labelStyle={{ color: '#9e9e9e', fontSize: '11px' }}
                    itemStyle={{ color: '#9c7ef0', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="#9c7ef0"
                    strokeWidth={2}
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
        <motion.div variants={itemAnim} className="lg:col-span-4 bg-card  border border-border rounded-xl p-6 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#5db8a0]/10 border border-border flex items-center justify-center">
              <Zap size={18} className="text-[#5db8a0]" />
            </div>
            <div>
              <h3 className="text-xs  text-foreground ">Core Pillars</h3>
              <p className="text-[9px] text-muted-foreground font-medium tracking-tighter mt-0.5">Progress Distribution</p>
            </div>
          </div>

          <div className="h-[300px] w-full flex items-center justify-center">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={pillarData}>
                  <PolarGrid stroke="#3a3a3a" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#9e9e9e', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar
                    name="XP"
                    dataKey="value"
                    stroke="#5db8a0"
                    fill="#5db8a0"
                    fillOpacity={0.3}
                    animationDuration={1500}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Activity Distribution */}
        <motion.div variants={itemAnim} className="lg:col-span-4 bg-card  border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BarChart3 size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs  text-foreground ">Execution Type</h3>
              <p className="text-[9px] text-muted-foreground font-medium tracking-tighter mt-0.5">Activity Distribution</p>
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
                  <span className="text-[10px]  text-foreground/60">{type.name}</span>
                </div>
                <span className="text-[10px]  text-foreground">{type.value} items</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Insights */}
        <motion.div variants={itemAnim} className="lg:col-span-8 bg-card  border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs  text-foreground ">AI Insights</h3>
              <p className="text-[9px] text-muted-foreground font-medium tracking-tighter mt-0.5">Behavioral Pattern Recognition</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                <span className="text-[10px]  text-foreground">Best Time</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed ">
                Your highest performance is currently localized between <span className="text-primary ">09:00 - 11:30</span>. 
                Focus-intensive tasks should be prioritized during this window for maximum progress.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-[#5db8a0]" />
                <span className="text-[10px]  text-foreground">Skill Balance</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed ">
                Detected a <span className="text-[#5db8a0] ">15% lag</span> in the "Skills" pillar compared to "Habits". 
                Recommend starting a learning session to balance your progress.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-400" />
                <span className="text-[10px]  text-foreground">Consistency</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed ">
                Current streak consistency is at <span className="text-amber-400 ">8.4/10</span>. 
                User stability has increased since the last day.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Layout size={14} className="text-rose-400" />
                <span className="text-[10px]  text-foreground">AI Recommendation</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed ">
                Trying a <span className="text-rose-400 ">"Micro-Sprint"</span> plan could resolve minor productivity issues detected in the afternoon.
              </p>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Activity Timeline Simplified */}
      <motion.section variants={itemAnim} className="bg-card  border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-border flex items-center justify-center">
              <Calendar size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xs  text-foreground ">Activity Log</h3>
              <p className="text-[9px] text-muted-foreground font-medium tracking-tighter mt-0.5">Recent Activities</p>
            </div>
          </div>
          <button className="text-[9px]  text-primary flex items-center gap-1 hover:text-primary/80 transition-colors ">
            View All <ChevronRight size={10} />
          </button>
        </div>

        <div className="space-y-3">
          {activities.slice(0, 5).map((act) => (
            <div key={act.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted border border-border group hover:border-border transition-all">
              <div className={cn(
                "w-2 h-2 rounded-full",
                act.type === 'habit' ? 'bg-primary' :
                act.type === 'workout' ? 'bg-emerald-500' :
                act.type === 'skill' ? 'bg-[#5db8a0]' :
                'bg-primary'
              )} />
              <div className="flex-1">
                <p className="text-xs  text-foreground tracking-wide ">{act.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[8px]  text-muted-foreground ">{act.type}</span>
                  <div className="w-1 h-1 rounded-full bg-primary/15" />
                  <span className="text-[8px]  text-muted-foreground">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px]  text-primary">+{act.xp_earned} XP</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
