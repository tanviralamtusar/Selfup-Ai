'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, User, Bell, Shield, Sparkles, Check,
  Loader2, ChevronRight, Eye, EyeOff, Brain, Zap
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type PersonaStyle = 'friendly' | 'strict' | 'motivational' | 'neutral'

const PERSONA_STYLES: Record<PersonaStyle, { label: string; description: string; emoji: string }> = {
  friendly:     { label: 'SUPPORTIVE',   description: 'Warm, encouraging, celebrates wins', emoji: '🌟' },
  strict:       { label: 'ELITE',       description: 'Direct, no excuses, elite standards', emoji: '⚔️' },
  motivational: { label: 'RELENTLESS', description: 'Hype-driven, high energy, relentless', emoji: '🔥' },
  neutral:      { label: 'ANALYTICAL',  description: 'Calm, analytical, data-focused', emoji: '🧠' },
}

function SectionHeader({ icon: Icon, title, subtitle, color = 'text-primary' }: {
  icon: React.FC<any>; title: string; subtitle: string; color?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-6 relative z-10">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-950 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]", color === 'text-blue-400' ? 'text-blue-400' : 'text-cyan-400')}>
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-sm font-black text-blue-100 uppercase tracking-[0.3em] italic">{title}</h2>
        <p className="text-[10px] text-blue-400/40 font-black uppercase tracking-[0.2em] italic">{subtitle}</p>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { profile, session } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'profile' | 'ai' | 'privacy' | 'notifications'>('profile')

  // Profile form state
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [isPublic, setIsPublic] = useState(profile?.is_public || false)

  // AI persona state
  const [personaName, setPersonaName] = useState(profile?.ai_persona_name || 'SYSTEM')
  const [personaStyle, setPersonaStyle] = useState<PersonaStyle>((profile?.ai_persona_style as PersonaStyle) || 'friendly')

  const [savedSection, setSavedSection] = useState<string | null>(null)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
      setIsPublic(profile.is_public || false)
      setPersonaName(profile.ai_persona_name || 'SYSTEM')
      setPersonaStyle((profile.ai_persona_style as PersonaStyle) || 'friendly')
    }
  }, [profile])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ display_name: displayName, bio, is_public: isPublic })
      })
      if (res.ok) {
        toast.success('Profile updated!')
        setSavedSection('profile')
        setTimeout(() => setSavedSection(null), 2000)
      }
    } catch { toast.error('Failed to save profile') }
    finally { setIsLoading(false) }
  }

  const handleSaveAI = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ ai_persona_name: personaName, ai_persona_style: personaStyle })
      })
      if (res.ok) {
        toast.success(`AI companion updated! Say hello to ${personaName}.`)
        setSavedSection('ai')
        setTimeout(() => setSavedSection(null), 2000)
      }
    } catch { toast.error('Failed to save AI settings') }
    finally { setIsLoading(false) }
  }

  const navItems = [
    { id: 'profile', label: 'VESSEL PROFILE', icon: User, subtitle: 'Identity & Visibility' },
    { id: 'ai', label: 'SELFUP COGNITION', icon: Brain, subtitle: 'Persona & Protocols' },
    { id: 'privacy', label: 'VESSEL ENCRYPTION', icon: Shield, subtitle: 'Data & Secrecy' },
    { id: 'notifications', label: 'NETWORK ALERTS', icon: Bell, subtitle: 'System Reminders' },
  ]

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <Settings size={28} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-4xl font-black font-headline tracking-[0.3em] italic text-blue-100 uppercase">Selfup Settings</h1>
          <p className="text-blue-400/60 text-sm font-bold italic tracking-widest uppercase">Calibrate your system interface.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Nav */}
        <div className="bg-slate-950/40 border border-blue-500/20 rounded-3xl p-2 space-y-1 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all group relative z-10",
                  activeSection === item.id
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'text-blue-400/40 hover:bg-blue-500/5 hover:text-blue-400 border border-transparent'
                )}
              >
                <Icon size={16} className={activeSection === item.id ? 'text-blue-400' : 'text-blue-400/40 group-hover:text-blue-400'} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] italic truncate">{item.label}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] italic text-blue-400/20 truncate">{item.subtitle}</p>
                </div>
                <ChevronRight size={12} className={cn("flex-shrink-0 transition-transform", activeSection === item.id ? 'text-blue-400 rotate-90' : 'text-blue-400/10')} />
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-slate-950/40 border border-blue-500/20 rounded-3xl p-8 space-y-6 backdrop-blur-md relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <SectionHeader icon={User} title="VESSEL IDENTITY" subtitle="How the network sees you" color="text-blue-400" />

              {/* Avatar preview */}
              <div className="flex items-center gap-6 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-blue-500/20 flex items-center justify-center font-black text-blue-400 text-2xl overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    : (displayName || profile?.username)?.[0]?.toUpperCase() || 'U'
                  }
                </div>
                <div>
                  <p className="text-sm font-black text-blue-100 italic uppercase tracking-widest">{displayName || profile?.username}</p>
                  <p className="text-xs font-black text-blue-400/40 uppercase tracking-[0.2em] italic">VESSEL @{profile?.username}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mt-1 italic">Vessel Rank {profile?.level} · {profile?.xp} XP</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/40 block mb-2 italic">IDENTIFIER</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder={profile?.username || 'Enter Identifier'}
                    className="w-full h-12 px-4 rounded-2xl bg-slate-950 border border-blue-500/20 text-blue-100 text-sm font-bold italic focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all placeholder:text-blue-500/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/40 block mb-2 italic">BIO-PROTOCOL</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    placeholder="Calibrating existence parameters..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-blue-500/20 text-blue-100 text-sm font-bold italic focus:outline-none focus:ring-1 focus:ring-blue-400/40 resize-none transition-all placeholder:text-blue-500/10"
                  />
                </div>

                {/* Public toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-3">
                    {isPublic ? <Eye size={16} className="text-cyan-400" /> : <EyeOff size={16} className="text-blue-400/20" />}
                    <div>
                      <p className="text-sm font-black text-blue-100 italic uppercase tracking-wider">Network Visibility</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-400/40 italic">
                        {isPublic ? 'VESSEL DETECTABLE BY NETWORK' : 'VESSEL ENCRYPTED'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPublic(p => !p)}
                    className={cn(
                      "w-12 h-6 rounded-full border-2 transition-all relative",
                      isPublic ? 'bg-blue-500 border-blue-400' : 'bg-slate-950 border-blue-500/20'
                    )}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all", isPublic ? 'left-6' : 'left-0.5')} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 text-slate-950 font-black text-xs uppercase tracking-[0.3em] italic shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 relative z-10"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> :
                 savedSection === 'profile' ? <Check size={16} /> : <Zap size={16} />}
                {savedSection === 'profile' ? 'SYNCHRONIZED!' : 'UPDATE PROTOCOL'}
              </button>
            </motion.div>
          )}

          {activeSection === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-slate-950/40 border border-blue-500/20 rounded-3xl p-8 space-y-6 backdrop-blur-md relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <SectionHeader icon={Sparkles} title="SELFUP COGNITION" subtitle="Calibrate System personality" color="text-cyan-400" />

              <div className="relative z-10">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/40 block mb-2 italic">SELFUP DESIGNATION</label>
                <input
                  type="text"
                  value={personaName}
                  onChange={e => setPersonaName(e.target.value)}
                  placeholder="System"
                  className="w-full h-12 px-4 rounded-2xl bg-slate-950 border border-blue-500/20 text-blue-100 text-sm font-bold italic focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all"
                />
              </div>

              <div className="relative z-10">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/40 block mb-3 italic">COACHING PROTOCOL</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.entries(PERSONA_STYLES) as [PersonaStyle, any][]).map(([key, conf]) => (
                    <button
                      key={key}
                      onClick={() => setPersonaStyle(key)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-2xl border text-left transition-all",
                        personaStyle === key
                          ? 'bg-blue-500/10 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                          : 'bg-slate-950/20 border-blue-500/10 hover:border-blue-500/20'
                      )}
                    >
                      <span className="text-xl leading-none">{conf.emoji}</span>
                      <div>
                        <p className={cn("text-xs font-black uppercase tracking-[0.2em] italic", personaStyle === key ? 'text-blue-400' : 'text-blue-100/60')}>{conf.label}</p>
                        <p className="text-[10px] text-blue-400/40 font-bold italic mt-0.5 uppercase">{conf.description}</p>
                      </div>
                      {personaStyle === key && <Check size={14} className="text-blue-400 ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/60 mb-2 italic">LOG PREVIEW</p>
                <p className="text-sm text-blue-100 font-bold italic tracking-wide">
                  "{personaStyle === 'friendly' ? `Affirmative. I am ${personaName} — synchronization at 100%. Let's crush today's protocols together! 🌟` :
                    personaStyle === 'strict' ? `${personaName} active. No excuses detected. State your objective, Vessel.` :
                    personaStyle === 'motivational' ? `LIMIT BREAK! ${personaName} is INITIALIZED. Ascend the ranks! 🔥` :
                    `${personaName} core online. Objective detected. Optimizing path...`}"
                </p>
              </div>

              <div className="flex gap-3 relative z-10">
                <button
                  onClick={handleSaveAI}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-[0.3em] italic shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> :
                   savedSection === 'ai' ? <Check size={16} /> : <Sparkles size={16} />}
                  {savedSection === 'ai' ? 'CORE UPDATED' : 'SYNCHRONIZE CORES'}
                </button>

                <button
                  onClick={() => window.location.href = '/chat'}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-950 text-blue-400 font-black text-xs uppercase tracking-[0.3em] italic border border-blue-500/20 hover:bg-slate-900 transition-all active:scale-95"
                >
                  <Brain size={16} className="text-cyan-400" />
                  TEST LINK
                </button>
              </div>
            </motion.div>
          )}

          {(activeSection === 'privacy' || activeSection === 'notifications') && (
            <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-slate-950/40 border border-blue-500/20 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <div className="py-16 text-center relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-slate-950 flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  {activeSection === 'privacy' ? <Shield size={28} className="text-blue-500/20" /> : <Bell size={28} className="text-blue-500/20" />}
                </div>
                <h3 className="text-sm font-black text-blue-500/20 uppercase tracking-[0.3em] italic">
                  {activeSection === 'privacy' ? 'VESSEL ENCRYPTION' : 'NETWORK ALERTS'}
                </h3>
                <p className="text-xs text-blue-500/10 mt-2 font-bold italic tracking-widest uppercase">Protocol coming in next iteration.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
