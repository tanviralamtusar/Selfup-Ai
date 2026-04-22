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
  friendly:     { label: 'Friendly',     description: 'Warm, encouraging, celebrates wins', emoji: '😊' },
  strict:       { label: 'Strict',       description: 'Direct, no excuses, elite standards', emoji: '⚔️' },
  motivational: { label: 'Motivational', description: 'Hype-driven, high energy, relentless', emoji: '🔥' },
  neutral:      { label: 'Neutral',      description: 'Calm, analytical, data-focused', emoji: '🧠' },
}

function SectionHeader({ icon: Icon, title, subtitle, color = 'text-primary' }: {
  icon: React.FC<any>; title: string; subtitle: string; color?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-surface-container-medium border border-outline-variant/10", color.replace('text-', 'bg-').replace(/text-([^/]+)/, 'bg-$1') + '/10')}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">{title}</h2>
        <p className="text-[10px] text-on-surface-variant/40 font-black uppercase tracking-widest">{subtitle}</p>
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
  const [personaName, setPersonaName] = useState(profile?.ai_persona_name || 'Nova')
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
      setPersonaName(profile.ai_persona_name || 'Nova')
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
    { id: 'profile', label: 'Profile', icon: User, subtitle: 'Name, bio & visibility' },
    { id: 'ai', label: 'AI Companion', icon: Brain, subtitle: 'Persona & behavior' },
    { id: 'privacy', label: 'Privacy', icon: Shield, subtitle: 'Data & visibility' },
    { id: 'notifications', label: 'Notifications', icon: Bell, subtitle: 'Alerts & reminders' },
  ]

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-container-medium flex items-center justify-center border border-outline-variant/10">
          <Settings size={28} className="text-on-surface-variant" />
        </div>
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-on-surface">Settings</h1>
          <p className="text-on-surface-variant/60 text-sm">Configure your SelfUp experience.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Nav */}
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-2 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all group",
                  activeSection === item.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container-medium/50 hover:text-on-surface border border-transparent'
                )}
              >
                <Icon size={16} className={activeSection === item.id ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest truncate">{item.label}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 truncate">{item.subtitle}</p>
                </div>
                <ChevronRight size={12} className={cn("flex-shrink-0 transition-transform", activeSection === item.id ? 'text-primary rotate-90' : 'text-on-surface-variant/20')} />
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 space-y-6"
            >
              <SectionHeader icon={User} title="Profile" subtitle="How others see you" />

              {/* Avatar preview */}
              <div className="flex items-center gap-6 p-5 bg-surface-container-medium/40 rounded-2xl border border-outline-variant/5">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest border border-outline-variant/10 flex items-center justify-center font-black text-primary text-2xl overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    : (displayName || profile?.username)?.[0]?.toUpperCase() || 'U'
                  }
                </div>
                <div>
                  <p className="text-sm font-black text-on-surface">{displayName || profile?.username}</p>
                  <p className="text-xs font-black text-on-surface-variant/40 uppercase tracking-widest">@{profile?.username}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Level {profile?.level} · {profile?.xp} XP</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 block mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder={profile?.username || 'Display name'}
                    className="w-full h-12 px-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 block mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell the world who you're becoming..."
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none transition-all"
                  />
                </div>

                {/* Public toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-medium/40 border border-outline-variant/5">
                  <div className="flex items-center gap-3">
                    {isPublic ? <Eye size={16} className="text-primary" /> : <EyeOff size={16} className="text-on-surface-variant/40" />}
                    <div>
                      <p className="text-sm font-black text-on-surface">Public Profile</p>
                      <p className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant/40">
                        {isPublic ? 'Visible on leaderboard' : 'Hidden from leaderboard'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPublic(p => !p)}
                    className={cn(
                      "w-12 h-6 rounded-full border-2 transition-all relative",
                      isPublic ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant/20'
                    )}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", isPublic ? 'left-6' : 'left-0.5')} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-on-primary font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> :
                 savedSection === 'profile' ? <Check size={16} /> : <Zap size={16} />}
                {savedSection === 'profile' ? 'Saved!' : 'Save Changes'}
              </button>
            </motion.div>
          )}

          {activeSection === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 space-y-6"
            >
              <SectionHeader icon={Sparkles} title="AI Companion" subtitle="Customize Nova's behavior" color="text-secondary" />

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 block mb-2">Companion Name</label>
                <input
                  type="text"
                  value={personaName}
                  onChange={e => setPersonaName(e.target.value)}
                  placeholder="Nova"
                  className="w-full h-12 px-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 block mb-3">Coaching Style</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.entries(PERSONA_STYLES) as [PersonaStyle, any][]).map(([key, conf]) => (
                    <button
                      key={key}
                      onClick={() => setPersonaStyle(key)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-2xl border text-left transition-all",
                        personaStyle === key
                          ? 'bg-secondary/10 border-secondary/30 shadow-sm shadow-secondary/10'
                          : 'border-outline-variant/10 hover:border-outline-variant/20'
                      )}
                    >
                      <span className="text-xl leading-none">{conf.emoji}</span>
                      <div>
                        <p className={cn("text-xs font-black uppercase tracking-widest", personaStyle === key ? 'text-secondary' : 'text-on-surface')}>{conf.label}</p>
                        <p className="text-[10px] text-on-surface-variant/40 font-medium mt-0.5">{conf.description}</p>
                      </div>
                      {personaStyle === key && <Check size={14} className="text-secondary ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Preview</p>
                <p className="text-sm text-on-surface font-medium italic">
                  "{personaStyle === 'friendly' ? `Hey! I'm ${personaName} — let's crush today's goals together! 🌟` :
                    personaStyle === 'strict' ? `${personaName} here. No excuses. What are we working on?` :
                    personaStyle === 'motivational' ? `LET'S GOOOO! ${personaName} is READY. What's the mission?! 🔥` :
                    `${personaName} online. State your objective and I'll optimize your path.`}"
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveAI}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-secondary text-on-secondary font-black text-xs uppercase tracking-widest shadow-lg shadow-secondary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> :
                   savedSection === 'ai' ? <Check size={16} /> : <Sparkles size={16} />}
                  {savedSection === 'ai' ? 'Saved!' : 'Update Companion'}
                </button>

                <button
                  onClick={() => window.location.href = '/chat'}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-surface-container-highest text-on-surface font-black text-xs uppercase tracking-widest border border-outline-variant/10 hover:bg-surface-container-medium transition-all active:scale-95"
                >
                  <Brain size={16} className="text-secondary" />
                  Test Persona
                </button>
              </div>
            </motion.div>
          )}

          {(activeSection === 'privacy' || activeSection === 'notifications') && (
            <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8"
            >
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-3xl bg-surface-container-medium flex items-center justify-center mx-auto mb-4 border border-outline-variant/10">
                  {activeSection === 'privacy' ? <Shield size={28} className="text-on-surface-variant/30" /> : <Bell size={28} className="text-on-surface-variant/30" />}
                </div>
                <h3 className="text-sm font-black text-on-surface-variant/30 uppercase tracking-widest">
                  {activeSection === 'privacy' ? 'Privacy Controls' : 'Notification Settings'}
                </h3>
                <p className="text-xs text-on-surface-variant/20 mt-2">Coming in the next update.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
