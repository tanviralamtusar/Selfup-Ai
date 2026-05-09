'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Plus, Sparkles, X, Loader2, Trophy, Clock, History, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { SkillCard } from '@/components/skills/SkillCard'
import { RoadmapTimeline } from '@/components/skills/RoadmapTimeline'
import { SkillSessionsHistory } from '@/components/skills/SkillSessionsHistory'
import { TestView } from '@/components/skills/TestView'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Skill {
  id: string
  name: string
  category: string
  current_level: string
  total_hours: number
  activeRoadmap?: {
    id: string
    title: string
    status: string
    plan_type: string
    difficulty: string
    daily_study_minutes: number
  } | null
  milestoneStats: {
    completed: number
    total: number
    progress: number
  }
}

export default function SkillsPage() {
  const { session } = useAuthStore()
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null)
  const [activeRoadmapData, setActiveRoadmapData] = useState<any>(null)
  const [roadmapProgress, setRoadmapProgress] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'roadmap' | 'history'>('roadmap')
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isRefreshingRoadmap, setIsRefreshingRoadmap] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoggingSession, setIsLoggingSession] = useState(false)
  const [roadmapStatus, setRoadmapStatus] = useState<string>('not_started')

  // Test state
  const [activeTestId, setActiveTestId] = useState<string | null>(null)

  // Add Skill Form
  const [newSkill, setNewSkill] = useState({ name: '', category: 'General' })

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
      setActiveRoadmapData(null)
      setRoadmapProgress(null)
      setRoadmapStatus('not_started')
      setSessions([])
      setActiveTab('roadmap')
    }
  }, [activeSkillId])

  // Polling for roadmap completion
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeSkillId && (roadmapStatus === 'pending' || roadmapStatus === 'processing')) {
      interval = setInterval(() => {
        fetchRoadmap(activeSkillId, true)
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
      if (res.ok && data.success) setSkills(data.data || [])
      else if (res.ok && Array.isArray(data)) setSkills(data)
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
        setActiveRoadmapData(data.data)
        setRoadmapProgress(data.progress || null)
        setRoadmapStatus(data.status || (data.data ? 'active' : 'not_started'))
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
      if (res.ok) setSessions(Array.isArray(data) ? data : data.data || [])
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
        body: JSON.stringify({ name: newSkill.name, category: newSkill.category })
      })
      if (res.ok) {
        toast.success('Skill added! Open the AI Chat to start the Scholar interview.')
        setIsAddModalOpen(false)
        setNewSkill({ name: '', category: 'General' })
        fetchSkills()
      }
    } catch (err) {
      toast.error('Failed to add skill')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!activeSkillId) return
    try {
      const res = await fetch(`/api/skills/${activeSkillId}/milestones`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ milestoneId })
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Milestone completed! +${data.data?.xpEarned || 50} XP`)
        fetchSkills()
        fetchRoadmap(activeSkillId)
      }
    } catch (err) {
      toast.error('Failed to complete milestone')
    }
  }

  const handleCompleteTopic = async (topicId: string) => {
    if (!activeSkillId) return
    try {
      const res = await fetch(`/api/skills/${activeSkillId}/topics`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ topicId })
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Topic done! +${data.data?.xpEarned || 10} XP`)
        fetchRoadmap(activeSkillId)
      }
    } catch (err) {
      toast.error('Failed to complete topic')
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
        toast.success(`Session logged! +${data.xpEarned} XP`)
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
            <h1 className="text-4xl font-black font-headline italic uppercase tracking-[0.3em] text-blue-400 system-text-glow">Skill Center</h1>
          </div>
          <p className="text-blue-400/60 text-sm font-bold tracking-widest uppercase italic pl-15">Track your progress and learn new skills.</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-500/20 text-blue-400 rounded-2xl font-black uppercase text-xs tracking-[0.2em] italic border border-blue-500/50 shadow-lg shadow-blue-500/10 hover:bg-blue-500/30 transition-all btn-press"
        >
          <Plus size={18} />
          Add Skill
        </button>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Skill Cards */}
        <div className="lg:col-span-7 space-y-6">
          {isLoading && skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-950/40 rounded-3xl border border-blue-500/20 border-dashed backdrop-blur-md">
              <Loader2 className="animate-spin text-blue-400 mb-4" />
              <p className="text-sm font-black uppercase tracking-[0.2em] italic text-blue-400/40">Loading skills...</p>
            </div>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-950/40 rounded-3xl border border-blue-500/20 border-dashed text-center px-6 backdrop-blur-md">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                <Sparkles size={32} className="text-blue-400/40" />
              </div>
              <h2 className="text-xl font-black mb-2 uppercase tracking-[0.2em] italic text-blue-100">No Skills Found</h2>
              <p className="text-sm text-blue-400/40 max-w-xs mb-8">You haven't added any skills yet. Start by adding your first skill.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-8 py-3 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl font-bold uppercase text-[10px] tracking-[0.3em] italic border border-blue-500/30 text-blue-400"
              >
                Add Your First Skill
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isActive={activeSkillId === skill.id}
                  onClick={() => setActiveSkillId(activeSkillId === skill.id ? null : skill.id)}
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
                      <p className="text-xs font-black uppercase text-blue-400 tracking-[0.3em] italic">Level: {activeSkill.current_level}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-blue-500/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-400/40">Milestones</p>
                      <p className="text-xl font-black text-blue-400 italic">{activeSkill.milestoneStats.completed}/{activeSkill.milestoneStats.total}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-blue-500/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-400/40">Time Spent</p>
                      <p className="text-xl font-black text-cyan-400 italic">{Number(activeSkill.total_hours || 0).toFixed(1)}h</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsLoggingSession(true)}
                    className="w-full mt-6 py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-black uppercase text-xs tracking-[0.3em] italic border border-blue-500/30 transition-all btn-press shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                  >
                    Log Session
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center border-b border-blue-500/10 bg-slate-950/50 sticky top-0 z-10">
                  <button
                    onClick={() => setActiveTab('roadmap')}
                    className={cn(
                      "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] italic border-b-2 transition-all flex items-center justify-center gap-2",
                      activeTab === 'roadmap' ? 'border-blue-400 text-blue-400 system-text-glow' : 'border-transparent text-blue-400/40 hover:text-blue-400'
                    )}
                  >
                    <BookOpen size={14} />
                    Roadmap
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                      "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] italic border-b-2 transition-all flex items-center justify-center gap-2",
                      activeTab === 'history' ? 'border-blue-400 text-blue-400 system-text-glow' : 'border-transparent text-blue-400/40 hover:text-blue-400'
                    )}
                  >
                    <History size={14} />
                    History
                  </button>
                </div>

                {/* Tab Content */}
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10">
                  {activeTab === 'roadmap' ? (
                    isRefreshingRoadmap && !activeRoadmapData ? (
                      <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400/40">Loading...</p>
                      </div>
                    ) : (
                      <RoadmapTimeline
                        skillId={activeSkillId}
                        skillName={activeSkill.name}
                        roadmap={activeRoadmapData}
                        progress={roadmapProgress}
                        roadmapStatus={roadmapStatus}
                        onCompleteMilestone={handleCompleteMilestone}
                        onCompleteTopic={handleCompleteTopic}
                        onStartTest={(testId) => setActiveTestId(testId)}
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
                className="bg-slate-950/40 border border-blue-500/10 border-dashed rounded-3xl p-10 text-center space-y-4 backdrop-blur-md"
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto border border-blue-500/20">
                  <History size={32} className="text-blue-400/30" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-blue-400/60">Select a Skill</h3>
                  <p className="text-xs text-blue-400/30 max-w-[200px] mx-auto">Click on a skill card to view its roadmap and progress.</p>
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-950 rounded-[32px] p-8 border border-blue-500/20 shadow-[0_0_60px_rgba(59,130,246,0.15)] relative z-10"
            >
              <h2 className="text-2xl font-black font-headline tracking-tighter mb-6 text-blue-100 uppercase italic">Add New Skill</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/40 ml-1">Skill Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Quantum Physics, Piano, Chess..."
                    className="w-full h-14 px-5 rounded-2xl bg-slate-900 border border-blue-500/20 text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all font-medium placeholder:text-blue-400/20"
                    value={newSkill.name}
                    onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/40 ml-1">Category</label>
                  <select
                    className="w-full h-14 px-5 rounded-2xl bg-slate-900 border border-blue-500/20 text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all font-medium appearance-none"
                    value={newSkill.category}
                    onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="Mental">Mental / Logic</option>
                    <option value="Physical">Physical / Sport</option>
                    <option value="Creative">Creative / Art</option>
                    <option value="Technical">Technical / Code</option>
                    <option value="Social">Social / Soft Skill</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Sparkles size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-400">AI Roadmap</p>
                    <p className="text-[10px] text-blue-400/60">Use the Chat to interview and generate a roadmap.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-blue-400/40 hover:bg-blue-500/10 transition-colors border border-blue-500/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSkill}
                  className="flex-1 h-14 bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 btn-press"
                >
                  Create Skill
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-950 rounded-[32px] p-8 border border-blue-500/20 shadow-[0_0_60px_rgba(59,130,246,0.15)] relative z-10"
            >
              <h2 className="text-2xl font-black font-headline tracking-tighter mb-6 text-blue-100 uppercase italic">Log Practice Session</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/40 ml-1">Duration (Minutes)</label>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black italic text-blue-400 w-20">{sessionData.duration}m</span>
                    <input
                      type="range"
                      min="5"
                      max="300"
                      step="5"
                      value={sessionData.duration}
                      onChange={e => setSessionData({ ...sessionData, duration: Number(e.target.value) })}
                      className="flex-1 h-2 bg-slate-900 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest ml-1">Expected: +{sessionData.duration} XP</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/40 ml-1">Session Notes</label>
                  <textarea
                    placeholder="What did you learn today?"
                    rows={3}
                    className="w-full p-5 rounded-2xl bg-slate-900 border border-blue-500/20 text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all font-medium resize-none placeholder:text-blue-400/20"
                    value={sessionData.notes}
                    onChange={e => setSessionData({ ...sessionData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setIsLoggingSession(false)}
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-blue-400/40 hover:bg-blue-500/10 transition-colors border border-blue-500/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogSession}
                  className="flex-1 h-14 bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 btn-press"
                >
                  Log Session
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Test Modal */}
        {activeTestId && (
          <TestView testId={activeTestId} onClose={() => setActiveTestId(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
