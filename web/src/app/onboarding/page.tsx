'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/constants/routes'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, User, Target, Sparkles, Brain } from 'lucide-react'
import { toast } from 'sonner'

type Step = 'about' | 'goals' | 'persona' | 'ready'
const steps: { id: Step; label: string; icon: any; color: string }[] = [
  { id: 'about', label: 'About You', icon: User, color: 'var(--blue)' },
  { id: 'goals', label: 'Your Goals', icon: Target, color: 'var(--green)' },
  { id: 'persona', label: 'AI Persona', icon: Brain, color: 'var(--pink)' },
  { id: 'ready', label: 'Ready!', icon: Sparkles, color: 'var(--amber)' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { profile, setProfile } = useAuthStore()
  const [currentStep, setCurrentStep] = useState<Step>('about')
  const [isLoading, setIsLoading] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    displayName: profile?.display_name || '',
    age: '',
    gender: 'prefer_not_to_say',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    goals: [] as string[],
    persona: 'balanced', // balanced, tough-love, analytical, cheerleader
  })

  // Prevent routing if already onboarding is done
  useEffect(() => {
    if (profile?.onboarding_done) {
      router.replace(ROUTES.DASHBOARD)
    }
  }, [profile, router])

  const stepIndex = steps.findIndex((s) => s.id === currentStep)
  const progressPercent = ((stepIndex + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep === 'about') {
      if (!formData.displayName) {
        toast.error('Please enter a display name')
        return
      }
      setCurrentStep('goals')
    } else if (currentStep === 'goals') {
      if (formData.goals.length === 0) {
        toast.error('Please select at least one goal')
        return
      }
      setCurrentStep('persona')
    } else if (currentStep === 'persona') {
      setCurrentStep('ready')
    }
  }

  const handleBack = () => {
    if (currentStep === 'goals') setCurrentStep('about')
    else if (currentStep === 'persona') setCurrentStep('goals')
    else if (currentStep === 'ready') setCurrentStep('persona')
  }

  const handleComplete = async () => {
    if (!profile) return
    setIsLoading(true)
    try {
      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          display_name: formData.displayName,
          age: parseInt(formData.age) || null,
          gender: formData.gender,
          timezone: formData.timezone,
          onboarding_done: true,
        })
        .eq('id', profile.id)

      if (profileError) throw profileError

      // 2. Refresh Profile in Store
      const { data: updatedProfile } = await supabase.from('user_profiles').select('*').eq('id', profile.id).single()
      if (updatedProfile) setProfile(updatedProfile)
      toast.success('Onboarding complete! Welcome to SelfUp.')
      router.push(ROUTES.DASHBOARD)
      
      // In background, we could trigger AI to generate initial roadmaps
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGoal = (goal: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }))
  }

  const inputClasses = "w-full px-4 py-3 rounded-sm bg-input border border-border text-foreground placeholder:text-foreground-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl transition-colors duration-1000"
          style={{ background: `radial-gradient(circle, ${steps[stepIndex].color} 0%, transparent 70%)` }} />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx < stepIndex
              const isActive = idx === stepIndex
              
              return (
              <div key={step.id} className="relative flex flex-col items-center gap-2 flex-1">
                {/* Line before */}
                {idx > 0 && (
                  <div className="absolute top-5 left-0 right-[calc(50%+20px)] h-[3px] bg-border -translate-y-1/2 -z-10 overflow-hidden">
                    <motion.div 
                      className="h-full bg-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted || isActive ? '100%' : '0%' }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                )}
                {/* Line after */}
                {idx < steps.length - 1 && (
                  <div className="absolute top-5 left-[calc(50%+20px)] right-0 h-[3px] bg-border -translate-y-1/2 -z-10 overflow-hidden">
                    <motion.div 
                      className="h-full bg-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                )}
                
                {/* Icon Node */}
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-all duration-500 border-2 bg-background relative z-10
                  ${isCompleted 
                      ? 'border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                      : isActive 
                        ? 'border-accent text-accent shadow-[0_0_15px_rgba(124,106,240,0.4)]' 
                        : 'border-border text-foreground-muted'}
                `}>
                  {/* Tint overlay to keep line from passing behind */}
                  {isCompleted && <div className="absolute inset-0 bg-green-500/10 rounded-full pointer-events-none" />}
                  
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 size={18} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <step.icon size={18} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <span className={`text-xs font-medium transition-colors duration-300 ${isCompleted ? 'text-green-500' : isActive ? 'text-foreground' : 'text-foreground-muted'}`}>
                  {step.label}
                </span>
              </div>
            )})}
          </div>
        </div>

        <div className="card p-6 md:p-8 min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              {/* ─── STEP 1: ABOUT ─── */}
              {currentStep === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display mb-2">Tell us about yourself</h2>
                    <p className="text-foreground-secondary">This helps Nova personalize your experience.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground-secondary mb-1">Display Name *</label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className={inputClasses}
                        placeholder="What should we call you?"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Age (Optional)</label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          className={inputClasses}
                          placeholder="e.g. 25"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Gender</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className={`${inputClasses} appearance-none cursor-pointer`}
                        >
                          <option value="prefer_not_to_say" className="bg-background text-foreground">Prefer not to say</option>
                          <option value="male" className="bg-background text-foreground">Male</option>
                          <option value="female" className="bg-background text-foreground">Female</option>
                          <option value="non_binary" className="bg-background text-foreground">Non-binary</option>
                          <option value="other" className="bg-background text-foreground">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: GOALS ─── */}
              {currentStep === 'goals' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display mb-2">What are your main goals?</h2>
                    <p className="text-foreground-secondary">Select all that apply.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'build_muscle', label: '💪 Build Muscle' },
                      { id: 'lose_weight', label: '📉 Lose Weight' },
                      { id: 'learn_skills', label: '🧠 Learn New Skills' },
                      { id: 'better_sleep', label: '😴 Better Sleep' },
                      { id: 'productivity', label: '⚡ Be More Productive' },
                      { id: 'style', label: '👔 Improve My Style' },
                    ].map((goal) => {
                      const isSelected = formData.goals.includes(goal.id)
                      return (
                        <button
                          key={goal.id}
                          onClick={() => toggleGoal(goal.id)}
                          className={`p-4 rounded-sm border text-left transition-all ${
                            isSelected 
                              ? 'border-green-500 bg-green-500/10 border-2 shadow-[0_0_15px_rgba(34,197,94,0.25)]' 
                              : 'border-border bg-input hover:border-border-strong hover:bg-elevated'
                          }`}
                        >
                          <span className={isSelected ? 'font-semibold text-green-400 text-sm' : 'font-medium text-foreground text-sm'}>
                            {goal.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── STEP 3: PERSONA ─── */}
              {currentStep === 'persona' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display mb-2">Choose Nova's Personality</h2>
                    <p className="text-foreground-secondary">How do you want your AI coach to talk to you?</p>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { id: 'balanced', title: 'Balanced & Supportive', desc: 'Friendly, helpful, and logical. The standard coach.' },
                      { id: 'tough-love', title: 'Tough Love (Drill Sergeant)', desc: 'Direct, pushing you hard, no excuses accepted.' },
                      { id: 'analytical', title: 'Analytical & Data-Driven', desc: 'Focuses on stats, metrics, and structured logic.' },
                      { id: 'cheerleader', title: 'Enthusiastic Cheerleader', desc: 'High energy, constantly motivating and celebrating wins.' },
                    ].map((persona) => {
                      const isSelected = formData.persona === persona.id
                      return (
                        <button
                          key={persona.id}
                          onClick={() => setFormData({ ...formData, persona: persona.id })}
                          className={`w-full p-4 rounded-sm border text-left flex gap-4 transition-all duration-300 ${
                            isSelected 
                              ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.35)] scale-[1.02]' 
                              : 'border-border bg-input hover:border-border-strong hover:bg-elevated'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            isSelected ? 'border-pink-500' : 'border-foreground-muted'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full" />}
                          </div>
                          <div>
                            <p className={isSelected ? 'font-semibold text-pink-400 mb-1 text-sm transition-colors' : 'font-medium text-foreground mb-1 text-sm transition-colors'}>
                              {persona.title}
                            </p>
                            <p className="text-xs text-foreground-secondary">
                              {persona.desc}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── STEP 4: READY ─── */}
              {currentStep === 'ready' && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
                  <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center relative">
                    <Sparkles size={40} className="text-accent absolute -top-2 -right-2 animate-pulse" />
                    <CheckCircle2 size={48} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold font-display mb-2">All Set!</h2>
                    <p className="text-foreground-secondary max-w-sm mx-auto">
                      Nova is analyzing your goals and preparing your first roadmap. Let's get to work!
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-border">
            <button
              onClick={handleBack}
              disabled={currentStep === 'about' || isLoading}
              className={`px-6 py-2.5 font-medium transition-colors ${
                currentStep === 'about' ? 'invisible' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Back
            </button>

            {currentStep === 'ready' ? (
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="px-8 py-2.5 rounded-sm font-semibold text-white transition-all btn-press disabled:opacity-50 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--xp-purple))' }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>Enter Dashboard <ChevronRight size={18} /></>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-2.5 bg-white text-black rounded-sm font-semibold hover:bg-slate-200 transition-colors btn-press flex items-center gap-2"
              >
                Next <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


