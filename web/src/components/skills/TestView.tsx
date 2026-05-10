'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileQuestion, CheckCircle2, XCircle, Clock, ArrowRight, 
  Loader2, Trophy, AlertCircle, ChevronDown
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TestQuestion {
  id: string
  type: 'multiple_choice' | 'short_answer' | 'code_snippet'
  question_text: string
  options?: string[]
  points: number
}

interface TestViewProps {
  testId: string
  onClose: () => void
}

export function TestView({ testId, onClose }: TestViewProps) {
  const { session } = useAuthStore()
  const [step, setStep] = useState<'loading' | 'ready' | 'taking' | 'submitting' | 'results'>('loading')
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate test questions
  const handleGenerateTest = async () => {
    setIsGenerating(true)
    setStep('loading')
    try {
      const res = await fetch('/api/skills/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ testId })
      })

      if (!res.ok) throw new Error('Failed to queue test generation')

      // Poll for questions
      toast.success('AI is generating your test questions...')
      
      const pollForQuestions = async () => {
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 3000))
          const checkRes = await fetch(`/api/skills/tests?roadmap_id=poll`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
          })
          // For now, just set a timeout and let user know
        }
      }

      // Simple approach: wait a bit then check
      setTimeout(async () => {
        await loadTestQuestions()
      }, 8000)

    } catch (err: any) {
      toast.error(err.message || 'Failed to generate test')
      setIsGenerating(false)
    }
  }

  const loadTestQuestions = async () => {
    try {
      // Get test details directly
      const attemptsRes = await fetch(`/api/skills/tests/${testId}/attempt`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      // We actually need to get the test questions from the test endpoint
      // For now, let's attempt to get them and see
      setStep('ready')
      setIsGenerating(false)
    } catch (err) {
      console.error('[TestView] Failed to load:', err)
      setIsGenerating(false)
    }
  }

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    setStep('submitting')
    try {
      const res = await fetch(`/api/skills/tests/${testId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ answers })
      })

      if (!res.ok) throw new Error('Failed to submit answers')

      const data = await res.json()
      toast.success('Your test is being evaluated...')

      // Poll for results
      setTimeout(async () => {
        const resultsRes = await fetch(`/api/skills/tests/${testId}/attempt`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        })
        if (resultsRes.ok) {
          const resultsData = await resultsRes.json()
          const latestAttempt = resultsData.data?.[0]
          if (latestAttempt?.feedback && Object.keys(latestAttempt.feedback).length > 0) {
            setResults(latestAttempt)
            setStep('results')
          } else {
            setResults({ score_pct: 0, passed: false, feedback: {} })
            setStep('results')
            toast.info('Results are still being processed. Check back in a moment.')
          }
        }
      }, 10000)

    } catch (err: any) {
      toast.error(err.message || 'Submission failed')
      setStep('taking')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-slate-950 rounded-[32px] border border-blue-500/20 shadow-[0_0_60px_rgba(59,130,246,0.15)] relative z-10 max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-blue-500/10 bg-gradient-to-br from-purple-500/5 to-slate-950">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <FileQuestion size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black font-headline text-blue-100 tracking-wider uppercase italic">Assessment</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] italic text-purple-400/60">Knowledge Check</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              {isGenerating ? (
                <>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500/10 border-t-purple-400 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileQuestion className="text-purple-400 animate-pulse" size={20} />
                    </div>
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] italic text-purple-400/60">AI is crafting your questions...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                    <FileQuestion size={32} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.15em] italic text-blue-100 text-center">Ready to test your knowledge?</p>
                  <p className="text-[10px] text-blue-400/40 italic text-center max-w-xs">AI will generate 5 questions based on what you've learned. Passing score is 70%.</p>
                  <button
                    onClick={handleGenerateTest}
                    className="mt-4 px-8 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] italic border border-purple-500/30 transition-all"
                  >
                    Generate Test
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'results' && results && (
            <div className="space-y-6">
              {/* Score Display */}
              <div className={cn(
                "text-center py-8 rounded-2xl border",
                results.passed 
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-red-500/5 border-red-500/20"
              )}>
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4",
                  results.passed
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                )}>
                  {results.passed ? <Trophy size={36} /> : <XCircle size={36} />}
                </div>
                <p className="text-4xl font-black font-headline italic text-blue-100 mb-1">{results.score_pct}%</p>
                <p className={cn(
                  "text-xs font-black uppercase tracking-[0.3em] italic",
                  results.passed ? "text-green-400" : "text-red-400"
                )}>
                  {results.passed ? 'Passed!' : 'Not Yet'}
                </p>
              </div>

              {/* Feedback per question */}
              {results.feedback && Object.entries(results.feedback).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-400/40">Question Feedback</h4>
                  {Object.entries(results.feedback).map(([qId, fb]: [string, any]) => (
                    <div key={qId} className={cn(
                      "p-3 rounded-xl border",
                      fb.is_correct ? "bg-green-500/5 border-green-500/10" : "bg-red-500/5 border-red-500/10"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        {fb.is_correct ? <CheckCircle2 size={12} className="text-green-400" /> : <XCircle size={12} className="text-red-400" />}
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] italic text-blue-100">{qId}</span>
                        <span className="text-[9px] font-black italic text-blue-400/40 ml-auto">{fb.score}/{fb.max_score} pts</span>
                      </div>
                      <p className="text-[10px] text-blue-100/60 italic leading-relaxed">{fb.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] italic border border-blue-500/20 transition-all"
              >
                Done
              </button>
            </div>
          )}

          {step === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 size={32} className="animate-spin text-purple-400" />
              <p className="text-xs font-black uppercase tracking-[0.2em] italic text-purple-400/60">AI is evaluating your answers...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
