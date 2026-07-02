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

const AI_MODELS = [
  { id: 'gemma-4-31b-it', name: 'Gemma 4 31B' },
  { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B (A4B)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
]

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
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-background border border-border ", color === 'text-primary' ? 'text-primary' : 'text-[#5db8a0]')}>
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-sm  text-foreground  ">{title}</h2>
        <p className="text-[10px] text-primary/40   ">{subtitle}</p>
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
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC')

  // AI persona state
  const [personaName, setPersonaName] = useState(profile?.ai_persona_name || 'SYSTEM')
  const [personaStyle, setPersonaStyle] = useState<PersonaStyle>((profile?.ai_persona_style as PersonaStyle) || 'friendly')
  const [chatModel, setChatModel] = useState(profile?.ai_chat_model || 'gemma-4-31b-it')
  const [backgroundModel, setBackgroundModel] = useState(profile?.ai_background_model || 'gemini-2.5-flash-lite')

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
      setChatModel(profile.ai_chat_model || 'gemma-4-31b-it')
      setBackgroundModel(profile.ai_background_model || 'gemini-2.5-flash-lite')
      setTimezone(profile.timezone || 'UTC')
    }
  }, [profile])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ display_name: displayName, bio, is_public: isPublic, timezone })
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
        body: JSON.stringify({ 
          ai_persona_name: personaName, 
          ai_persona_style: personaStyle,
          ai_chat_model: chatModel,
          ai_background_model: backgroundModel
        })
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
    { id: 'profile', label: 'PROFILE', icon: User, subtitle: 'Identity & Visibility' },
    { id: 'ai', label: 'AI COMPANION', icon: Brain, subtitle: 'Persona & Style' },
    { id: 'privacy', label: 'PRIVACY', icon: Shield, subtitle: 'Data & Visibility' },
    { id: 'notifications', label: 'NOTIFICATIONS', icon: Bell, subtitle: 'App Reminders' },
  ]

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-border ">
          <Settings size={28} className="text-primary" />
        </div>
        <div>
          <h1 className="text-4xl  font-headline   text-foreground">Selfup Settings</h1>
          <p className="text-primary/60 text-sm font-medium ">Adjust your profile and AI settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Nav */}
        <div className="bg-card border border-border rounded-xl p-2 space-y-1  relative overflow-hidden">
          <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all group relative z-10",
                  activeSection === item.id
                    ? 'bg-primary/10 text-primary border border-border '
                    : 'text-primary/40 hover:bg-muted hover:text-primary border border-transparent'
                )}
              >
                <Icon size={16} className={activeSection === item.id ? 'text-primary' : 'text-primary/40 group-hover:text-primary'} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs    truncate">{item.label}</p>
                  <p className="text-[9px]    text-primary/20 truncate">{item.subtitle}</p>
                </div>
                <ChevronRight size={12} className={cn("flex-shrink-0 transition-transform", activeSection === item.id ? 'text-primary rotate-90' : 'text-primary/10')} />
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl p-8 space-y-6  relative overflow-hidden"
            >
              <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
              <SectionHeader icon={User} title="PROFILE IDENTITY" subtitle="How others see you" color="text-primary" />

              {/* Avatar preview */}
              <div className="flex items-center gap-6 p-5 bg-muted rounded-xl border border-border relative z-10">
                <div className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center  text-primary text-2xl overflow-hidden ">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    : (displayName || profile?.username)?.[0]?.toUpperCase() || 'U'
                  }
                </div>
                <div>
                  <p className="text-sm  text-foreground ">{displayName || profile?.username}</p>
                  <p className="text-xs  text-primary/40  ">@{profile?.username}</p>
                  <p className="text-[10px]   text-primary mt-1 ">Level {profile?.level} · {profile?.xp} XP</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div>
                  <label className="text-[10px]   text-primary/40 block mb-2 ">DISPLAY NAME</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder={profile?.username || 'Enter Identifier'}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground text-sm font-medium  focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px]   text-primary/40 block mb-2 ">BIO</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium  focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none transition-all placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px]   text-primary/40 block mb-2 ">TIMEZONE</label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground text-sm font-medium  focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer transition-all"
                  >
                    {Intl.supportedValuesOf('timeZone').map(tz => (
                      <option key={tz} value={tz} className="bg-background text-foreground">
                        {tz.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-primary/30 mt-2   ml-1">
                    Current detected time: {new Date().toLocaleTimeString('en-US', { timeZone: timezone })}
                  </p>
                </div>

                {/* Public toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
                  <div className="flex items-center gap-3">
                    {isPublic ? <Eye size={16} className="text-[#5db8a0]" /> : <EyeOff size={16} className="text-primary/20" />}
                    <div>
                      <p className="text-sm  text-foreground ">Network Visibility</p>
                      <p className="text-[10px]   text-primary/40 ">
                        {isPublic ? 'VISIBLE TO OTHERS' : 'PRIVATE PROFILE'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPublic(p => !p)}
                    className={cn(
                      "w-12 h-6 rounded-full border-2 transition-all relative",
                      isPublic ? 'bg-primary border-primary/30' : 'bg-background border-border'
                    )}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-foreground  transition-all", isPublic ? 'left-6' : 'left-0.5')} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-foreground  text-xs    hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 relative z-10"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> :
                 savedSection === 'profile' ? <Check size={16} /> : <Zap size={16} />}
                {savedSection === 'profile' ? 'SAVED!' : 'SAVE CHANGES'}
              </button>
            </motion.div>
          )}

          {activeSection === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl p-8 space-y-6  relative overflow-hidden"
            >
              <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
              <SectionHeader icon={Sparkles} title="AI COMPANION" subtitle="Adjust your AI's personality" color="text-[#5db8a0]" />

              <div className="relative z-10">
                <label className="text-[10px]   text-primary/40 block mb-2 ">AI NAME</label>
                <input
                  type="text"
                  value={personaName}
                  onChange={e => setPersonaName(e.target.value)}
                  placeholder="System"
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground text-sm font-medium  focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                <div>
                  <label className="text-[10px]   text-primary/40 block mb-2 ">DEFAULT CHAT MODEL</label>
                  <select
                    value={chatModel}
                    onChange={e => setChatModel(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground text-sm font-medium  focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer transition-all"
                  >
                    {AI_MODELS.map(m => (
                      <option key={m.id} value={m.id} className="bg-background text-foreground">{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px]   text-primary/40 block mb-2 ">BACKGROUND TASKS MODEL</label>
                  <select
                    value={backgroundModel}
                    onChange={e => setBackgroundModel(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground text-sm font-medium  focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer transition-all"
                  >
                    {AI_MODELS.map(m => (
                      <option key={m.id} value={m.id} className="bg-background text-foreground">{m.name}</option>
                    ))}
                  </select>
                  <p className="text-[9px]   text-primary/30 mt-2  px-1">Used for scheduling, evaluations, and memory.</p>
                </div>
              </div>

              <div className="relative z-10">
                <label className="text-[10px]   text-primary/40 block mb-3 ">AI PERSONALITY</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.entries(PERSONA_STYLES) as [PersonaStyle, any][]).map(([key, conf]) => (
                    <button
                      key={key}
                      onClick={() => setPersonaStyle(key)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                        personaStyle === key
                          ? 'bg-primary/10 border-border '
                          : 'bg-background/20 border-border hover:border-border'
                      )}
                    >
                      <span className="text-xl leading-none">{conf.emoji}</span>
                      <div>
                        <p className={cn("text-xs   ", personaStyle === key ? 'text-primary' : 'text-foreground/60')}>{conf.label}</p>
                        <p className="text-[10px] text-primary/40 font-medium  mt-0.5">{conf.description}</p>
                      </div>
                      {personaStyle === key && <Check size={14} className="text-primary ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-[#5db8a0]/5 border border-border relative z-10">
                <p className="text-[10px]   text-[#5db8a0]/60 mb-2 ">MESSAGE PREVIEW</p>
                <p className="text-sm text-foreground font-medium  tracking-wide">
                  "{personaStyle === 'friendly' ? `Hi! I'm ${personaName}. Let's work on your goals together! 🌟` :
                    personaStyle === 'strict' ? `${personaName} active. Focus on your tasks. No excuses.` :
                    personaStyle === 'motivational' ? `LET'S GO! ${personaName} is ready. Time to level up! 🔥` :
                    `${personaName} online. Ready to help you optimize your day.`}"
                </p>
              </div>

              <div className="flex gap-3 relative z-10">
                <button
                  onClick={handleSaveAI}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#5db8a0] text-foreground  text-xs    hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> :
                   savedSection === 'ai' ? <Check size={16} /> : <Sparkles size={16} />}
                  {savedSection === 'ai' ? 'SAVED' : 'SAVE AI SETTINGS'}
                </button>

                <button
                  onClick={() => window.location.href = '/chat'}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-background text-primary  text-xs   border border-border hover:bg-muted transition-all active:scale-95"
                >
                  <Brain size={16} className="text-[#5db8a0]" />
                  GO TO CHAT
                </button>
              </div>
            </motion.div>
          )}

          {(activeSection === 'privacy' || activeSection === 'notifications') && (
            <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl p-8  relative overflow-hidden"
            >
              <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
              <div className="py-16 text-center relative z-10">
                <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center mx-auto mb-4 border border-border ">
                  {activeSection === 'privacy' ? <Shield size={28} className="text-muted-foreground" /> : <Bell size={28} className="text-muted-foreground" />}
                </div>
                <h3 className="text-sm  text-muted-foreground  ">
                  {activeSection === 'privacy' ? 'PRIVACY' : 'NOTIFICATIONS'}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 font-medium ">Coming soon.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
