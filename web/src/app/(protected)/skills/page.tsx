'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Plus, Search, Sparkles, X, Loader2, Trophy, Clock, History, LayoutGrid, List } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { SkillCard } from '@/components/skills/SkillCard'
import { RoadmapTimeline } from '@/components/skills/RoadmapTimeline'
import { SkillSessionsHistory } from '@/components/skills/SkillSessionsHistory'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Skill {
  id: string
  name: string
  category: string
  current_level: string
  total_hours: number
  milestoneStats: {
    completed: number
    total: number
    progress: number
  }
}

export default function SkillsPage() {
  const { session, profile, setProfile } = useAuthStore()
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null)
  const [activeRoadmap, setActiveRoadmap] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'roadmap' | 'history'>('roadmap')
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isRefreshingRoadmap, setIsRefreshingRoadmap] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoggingSession, setIsLoggingSession] = useState(false)
  const [roadmapStatus, setRoadmapStatus] = useState<'not_started' | 'pending' | 'processing' | 'completed' | 'failed'>('not_started')
  const [roadmapError, setRoadmapError] = useState<string | null>(null)

  // Add Skill Form
  const [newSkill, setNewSkill] = useState({ name: '', category: 'General', generateRoadmap: true })
  
  // Log Session Form
  const [sessionData, setSessionData] = useState({ duration: 30, notes: '' })

  useEffect(() => {
    if (session?.access_token) {
      fetchSkills()
    }
  }, [session])

  useEffect(() => {
    if (activeSkillId) {
      fetchRoadmap(activeSkillId)
      fetchSessions(activeSkillId)
    } else {
      setActiveRoadmap(null)
      setRoadmapStatus('not_started')
      setRoadmapError(null)
      setSessions([])
      setActiveTab('roadmap')
    }
  }, [activeSkillId])

  // Polling for roadmap completion
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeSkillId && (roadmapStatus === 'pending' || roadmapStatus === 'processing')) {
      interval = setInterval(() => {
        fetchRoadmap(activeSkillId, true) // silent fetch
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [activeSkillId, roadmapStatus])

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (res.ok) setSkills(data)
    } catch (err) {
      toast.error('Failed to load skills')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoadmap = async (id: string, silent = false) => {
    if (!silent) setIsRefreshingRoadmap(true)
    try {
      const res = await fetch(`/api/skills/${id}/roadmap`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setActiveRoadmap(data.roadmap)
        setRoadmapStatus(data.status)
        setRoadmapError(data.error)
        
        if (data.status === 'completed' && !silent) {
          // fetchSkills() // Refresh progress stats if roadmap just completed
        }
      }
    } catch (err) {
      if (!silent) toast.error('Failed to load roadmap')
    } finally {
      if (!silent) setIsRefreshingRoadmap(false)
    }
  }

  const fetchSessions = async (id: string) => {
    setIsLoadingSessions(true)
    try {
      const res = await fetch(`/api/skills/${id}/sessions`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (res.ok) setSessions(data)
    } catch (err) {
      toast.error('Failed to load session history')
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleAddSkill = async () => {
    if (!newSkill.name) return toast.error('Enter a skill name')
    setIsLoading(true)
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(newSkill)
      })
      if (res.ok) {
        toast.success('Skill added! System is crafting your roadmap.')
        setIsAddModalOpen(false)
        setNewSkill({ name: '', category: 'General', generateRoadmap: true })
        fetchSkills()
      }
    } catch (err) {
      toast.error('Failed to add skill')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleMilestone = async (milestoneId: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ isCompleted })
      })
      if (res.ok) {
        toast.success(isCompleted ? '+100 XP Earned!' : 'Progress updated')
        // Refresh local state
        fetchSkills()
        if (activeSkillId) fetchRoadmap(activeSkillId)
      }
    } catch (err) {
      toast.error('Failed to update milestone')
    }
  }

  const handleLogSession = async () => {
    if (!activeSkillId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/skills/${activeSkillId}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          durationMinutes: sessionData.duration,
          notes: sessionData.notes
        })
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Session logged! +${data.xpEarned} XP Earned.`)
        setIsLoggingSession(false)
        setSessionData({ duration: 30, notes: '' })
        fetchSkills()
        fetchSessions(activeSkillId)
      }
    } catch (err) {
      toast.error('Failed to log session')
    } finally {
      setIsLoading(false)
    }
  }

  const activeSkill = skills.find(s => s.id === activeSkillId)

  return (
    <div className="space-y-10 pb-20">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <Brain size={28} />
            </div>
            <h1 className="text-4xl font-black font-headline italic uppercase tracking-[0.3em] text-blue-400 system-text-glow">System Skill Registry</h1>
          </div>
          <p className="text-blue-400/60 text-sm font-bold tracking-widest uppercase italic pl-15">Architect your path to mastery with System guidance.</p>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-500/20 text-blue-400 rounded-2xl font-black uppercase text-xs tracking-[0.2em] italic border border-blue-500/50 shadow-lg shadow-blue-500/10 hover:bg-blue-500/30 transition-all btn-press"
        >
          <Plus size={18} />
          Initialize Mastery
        </button>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Skill Cards */}
        <div className="lg:col-span-7 space-y-6">
            {isLoading && skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-950/40 rounded-3xl border border-blue-500/20 border-dashed backdrop-blur-md">
                <Loader2 className="animate-spin text-blue-400 mb-4" />
                <p className="text-sm font-black uppercase tracking-[0.2em] italic text-blue-400/40">Syncing with System Database...</p>
              </div>
            ) : skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-950/40 rounded-3xl border border-blue-500/20 border-dashed text-center px-6 backdrop-blur-md">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                   <Sparkles size={32} className="text-blue-400/40" />
                </div>
                <h2 className="text-xl font-black mb-2 uppercase tracking-[0.2em] italic text-blue-100">Empty Registry</h2>
                <p className="text-sm text-blue-400/40 max-w-xs mb-8">You haven't defined any masteries yet. Let System help you choose a path.</p>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-8 py-3 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl font-bold uppercase text-[10px] tracking-[0.3em] italic border border-blue-500/30 text-blue-400"
                >
                  Begin Your Journey
                </button>
              </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map(skill => (
                <SkillCard 
                  key={skill.id} 
                  skill={skill} 
                  onClick={() => setActiveSkillId(skill.id)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Active Skill Roadmap / Details */}
        <div className="lg:col-span-5 relative">
          <AnimatePresence mode="wait">
            {activeSkillId && activeSkill ? (
              <motion.div
                key={activeSkillId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-950/80 border border-blue-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)] sticky top-24 backdrop-blur-xl"
              >
                {/* Detail Header */}
                <div className="p-8 border-b border-blue-500/20 relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-slate-950">
                  <button 
                    onClick={() => setActiveSkillId(null)}
                    className="absolute top-4 right-4 p-2 hover:bg-blue-500/10 rounded-full text-blue-400/40 transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black font-headline text-blue-100 tracking-tight uppercase italic">{activeSkill.name}</h2>
                      <p className="text-xs font-black uppercase text-blue-400 tracking-[0.3em] italic">Rank: {activeSkill.current_level}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-blue-500/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-400/40">XP Accumulation</p>
                      <p className="text-xl font-black text-blue-400 italic">+{activeSkill.milestoneStats.completed * 100}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-blue-500/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-400/40">Temporal Investment</p>
                      <p className="text-xl font-black text-cyan-400 italic">{Number(activeSkill.total_hours || 0).toFixed(1)}h</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsLoggingSession(true)}
                    className="w-full mt-6 py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-black uppercase text-xs tracking-[0.3em] italic border border-blue-500/30 transition-all btn-press shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                  >
                    Initiate Practice Session
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center border-b border-outline-variant/10 bg-surface-container-low sticky top-0 z-10">
                  <button 
                    onClick={() => setActiveTab('roadmap')}
                    className={cn(
                      "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] italic border-b-2 transition-all",
                      activeTab === 'roadmap' ? 'border-blue-400 text-blue-400 system-text-glow' : 'border-transparent text-blue-400/40 hover:text-blue-400'
                    )}
                  >
                    Roadmap
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={cn(
                      "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] italic border-b-2 transition-all",
                      activeTab === 'history' ? 'border-blue-400 text-blue-400 system-text-glow' : 'border-transparent text-blue-400/40 hover:text-blue-400'
                    )}
                  >
                    Progress Trace
                  </button>
                </div>

                {/* Tab Content View */}
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10">
                  {activeTab === 'roadmap' ? (
                    isRefreshingRoadmap && !activeRoadmap ? (
                      <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Accessing Archives...</p>
                      </div>
                    ) : (
                      <RoadmapTimeline 
                        skillName={activeSkill.name}
                        milestones={activeRoadmap?.skill_milestones || []} 
                        onToggleMilestone={handleToggleMilestone}
                      />
                    )
                  ) : (
                    <SkillSessionsHistory sessions={sessions} isLoading={isLoadingSessions} />
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface-container-low/50 border border-outline-variant/10 border-dashed rounded-3xl p-10 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto opacity-40">
                  <History size={32} className="text-on-surface-variant" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Focus Required</h3>
                  <p className="text-xs text-on-surface-variant/40 max-w-[200px] mx-auto">Select a mastery from your repository to view the active roadmap.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Modals ─── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container-high rounded-[32px] p-8 border border-outline-variant/10 shadow-2xl relative z-10"
            >
              <h2 className="text-2xl font-black font-headline tracking-tighter mb-6">Craft New Mastery</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 ml-1">Skill Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Quantum Physics, Piano, Chess..."
                    className="w-full h-14 px-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium"
                    value={newSkill.name}
                    onChange={e => setNewSkill({...newSkill, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 ml-1">Category</label>
                  <select 
                     className="w-full h-14 px-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium appearance-none"
                     value={newSkill.category}
                     onChange={e => setNewSkill({...newSkill, category: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="Mental">Mental / Logic</option>
                    <option value="Physical">Physical / Sport</option>
                    <option value="Creative">Creative / Art</option>
                    <option value="Technical">Technical / Code</option>
                    <option value="Social">Social / Soft Skill</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                   <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <Sparkles size={20} />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-primary">AI Roadmap Architect</p>
                      <p className="text-[10px] text-primary/60">System will build a custom milestone path.</p>
                   </div>
                   <input 
                    type="checkbox" 
                    checked={newSkill.generateRoadmap}
                    onChange={e => setNewSkill({...newSkill, generateRoadmap: e.target.checked})}
                    className="w-6 h-6 rounded-lg bg-primary/20 border-primary/40 text-primary focus:ring-primary/40 transition-all cursor-pointer"
                   />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSkill}
                  className="flex-1 h-14 bg-primary text-on-primary rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 btn-press"
                >
                  Forge Path
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isLoggingSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoggingSession(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container-high rounded-[32px] p-8 border border-outline-variant/10 shadow-2xl relative z-10"
            >
              <h2 className="text-2xl font-black font-headline tracking-tighter mb-6">Log Practice Session</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 ml-1">Duration (Minutes)</label>
                  <div className="flex items-center gap-4">
                     <span className="text-2xl font-black italic text-primary w-20">{sessionData.duration}m</span>
                     <input 
                      type="range" 
                      min="5" 
                      max="300"
                      step="5"
                      value={sessionData.duration}
                      onChange={e => setSessionData({...sessionData, duration: Number(e.target.value)})}
                      className="flex-1 h-2 bg-surface-container-lowest rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  <p className="text-[10px] text-secondary font-black uppercase tracking-widest ml-1">Expected: +{sessionData.duration} XP</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 ml-1">Session Notes</label>
                  <textarea 
                    placeholder="What did you learn today?"
                    rows={3}
                    className="w-full p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium resize-none"
                    value={sessionData.notes}
                    onChange={e => setSessionData({...sessionData, notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => setIsLoggingSession(false)}
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogSession}
                  className="flex-1 h-14 bg-primary text-on-primary rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 btn-press"
                >
                  Lock in XP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

