'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Sparkles, Dumbbell, Brain, Clock, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { setSession, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      setSession(data.session)
      setUser(data.user)
      toast.success('Welcome back! 🎉')
      router.push(ROUTES.DASHBOARD)
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${ROUTES.DASHBOARD}` },
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || 'Google login failed')
    }
  }

  const features = [
    { icon: Sparkles, label: 'AI-Powered Coach', color: 'var(--accent-primary)' },
    { icon: Dumbbell, label: 'Fitness Tracking', color: 'var(--green)' },
    { icon: Brain, label: 'Skill Roadmaps', color: 'var(--blue)' },
    { icon: Clock, label: 'Time Management', color: 'var(--amber)' },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* ─── Left Hero Section ─── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
      >
        {/* Gradient background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #1C1C28 0%, #0A0A0F 50%, #12121A 100%)',
        }} />

        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 right-20 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, var(--xp-blue) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--green) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative z-10 max-w-md px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-5xl font-extrabold font-display leading-tight mb-4">
              <span className="text-gradient">Level Up</span>
              <br />
              <span className="text-foreground">Your Life</span>
            </h1>
            <p className="text-foreground-secondary text-lg mb-10 leading-relaxed">
              Your AI-powered personal life operating system. Track fitness, build skills,
              manage time, and upgrade your style — all gamified.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            {features.map((feat, i) => (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1+0.1 }}
                className="flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ background: `color-mix(in srgb, ${feat.color} 15%, transparent)` }}
                >
                  <feat.icon size={20} style={{ color: feat.color }} />
                </div>
                <span className="text-foreground font-medium">{feat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ─── Right Login Form ─── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tighter text-gradient font-headline">SelfUp</h1>
            <p className="text-on-surface-variant mt-2 font-medium">Level Up Your Life</p>
          </div>

          <div className="bg-surface-container-low p-8 md:p-10 rounded-[2rem] border border-outline-variant/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
            
            <h2 className="text-3xl font-black tracking-tighter mb-2 font-headline">Welcome Back</h2>
            <p className="text-on-surface-variant mb-8 font-medium">Sign in to continue your journey</p>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-xs font-black uppercase tracking-widest text-on-surface-variant">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-highest/50 border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="login-password" className="block text-xs font-black uppercase tracking-widest text-on-surface-variant">
                    Password
                  </label>
                  <Link
                    href={ROUTES.FORGOT_PASSWORD}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-fixed-dim transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-highest/50 border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none pr-12"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-on-primary transition-all btn-press disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary-container))',
                }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    Sign In
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
              onClick={handleGoogleLogin}
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

            {/* Sign Up Link */}
            <p className="text-center text-on-surface-variant text-xs mt-8 font-medium">
              Don&apos;t have an account?{' '}
              <Link href={ROUTES.SIGNUP} className="text-primary hover:text-primary-fixed-dim font-black uppercase tracking-widest transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}



