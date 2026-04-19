'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/constants/routes'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error

      setSent(true)
      toast.success('Reset link sent! Check your inbox.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-accent" />
              </div>
              <h2 className="text-2xl font-bold font-display mb-2">Check Your Email</h2>
              <p className="text-foreground-secondary mb-6">
                We sent a password reset link to <strong className="text-foreground">{email}</strong>
              </p>
              <Link
                href={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <Link
                href={ROUTES.LOGIN}
                className="inline-flex items-center gap-1 text-foreground-secondary hover:text-foreground text-sm mb-6 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>

              <h2 className="text-2xl font-bold font-display mb-2">Reset Password</h2>
              <p className="text-foreground-secondary mb-6">
                Enter your email and we'll send you a reset link
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-sm bg-input border border-border text-foreground placeholder:text-foreground-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-sm font-semibold text-white transition-all btn-press disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--xp-purple))',
                  }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}



