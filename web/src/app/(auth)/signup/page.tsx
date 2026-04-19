'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, User, Mail, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const { setSession, setUser } = useAuthStore()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username,
            display_name: form.username,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      })
      if (error) throw error

      if (data.session) {
        setSession(data.session)
        setUser(data.user)
        toast.success('Welcome to SelfUp! 🚀')
        router.push(ROUTES.ONBOARDING)
      } else {
        toast.success('Check your email to confirm your account')
        router.push(ROUTES.LOGIN)
      }
    } catch (err: any) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${ROUTES.ONBOARDING}` },
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || 'Google signup failed')
    }
  }

  const inputClasses = "w-full pl-11 pr-4 py-3 rounded-sm bg-input border border-border text-foreground placeholder:text-foreground-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none"
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-8">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full opacity-10 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full opacity-10 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <Sparkles className="text-primary" size={32} />
            <h1 className="text-4xl font-black tracking-tighter text-gradient font-headline">SelfUp</h1>
          </div>
          <p className="text-on-surface-variant font-medium">Begin your self-improvement journey</p>
        </div>

        <div className="bg-surface-container-low p-8 md:p-10 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
          
          <h2 className="text-2xl font-black tracking-tighter mb-8 font-headline">Create Account</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Username */}
            <div className="relative group">
              <User size={18} className={cn(iconClasses, "group-focus-within:text-primary transition-colors")} />
              <input
                id="signup-username"
                type="text"
                value={form.username}
                onChange={(e) => updateField('username', e.target.value)}
                className={cn(inputClasses, "h-12 px-12 pl-12")}
                placeholder="Username"
                autoComplete="username"
              />
            </div>

            {/* Email */}
            <div className="relative group">
              <Mail size={18} className={cn(iconClasses, "group-focus-within:text-primary transition-colors")} />
              <input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={cn(inputClasses, "h-12 px-12 pl-12")}
                placeholder="Email"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock size={18} className={cn(iconClasses, "group-focus-within:text-primary transition-colors")} />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className={cn(inputClasses, "h-12 px-12 pl-12 pr-12")}
                placeholder="Password (min 8 characters)"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <Lock size={18} className={cn(iconClasses, "group-focus-within:text-primary transition-colors")} />
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                className={cn(inputClasses, "h-12 px-12 pl-12")}
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-on-primary transition-all btn-press disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/20"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary-container))',
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-outline-variant/10" />
            <span className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-outline-variant/10" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignup}
            className="w-full h-12 rounded-xl bg-surface-container-highest/30 border border-outline-variant/10 text-on-surface text-xs font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all btn-press flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Login Link */}
          <p className="text-center text-on-surface-variant text-xs mt-8 font-medium">
            Already have an account?{' '}
            <Link href={ROUTES.LOGIN} className="text-primary hover:text-primary-fixed-dim font-black uppercase tracking-widest transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}


