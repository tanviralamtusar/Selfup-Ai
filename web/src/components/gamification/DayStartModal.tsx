'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Flame, Heart, Sunrise, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { SystemFrame } from '../ui/SystemFrame'

interface CronDaily {
  id: string
  title: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  scheduled_time: string | null
  xp_reward: number
  xp_penalty: number
  current_streak: number
  is_completed: boolean
}

interface CronSummary {
  ranFor: string
  totalDue: number
  completedCount: number
  missedCount: number
  xpEarned: number
  xpLost: number
  hpLost: number
  perfectDay: boolean
}

const PRIORITY_ACCENT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-sky-400',
  low: 'bg-emerald-400',
}

/**
 * Habitica-style new-day check-in.
 *
 * Nothing is scored until the user presses "Start My New Day" — the server
 * holds yesterday open until then, so opening the app late never silently
 * costs you the dailies you actually did.
 */
export function DayStartModal() {
  const { session, setProfile } = useAuthStore()
  const [dailies, setDailies] = useState<CronDaily[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<CronSummary | null>(null)

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }), [session])

  // Check whether a new day is pending
  useEffect(() => {
    if (!session?.access_token) return
    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch('/api/dailies/cron', { headers: authHeaders() })
        if (!res.ok) return
        const json = await res.json()
        if (cancelled || !json.data?.isDue) return

        const due: CronDaily[] = json.data.dailies ?? []
        setDailies(due)
        // Dailies ticked in-app during the day stay ticked.
        setChecked(new Set(due.filter((d) => d.is_completed).map((d) => d.id)))
        setIsOpen(true)
      } catch (err) {
        console.error('[DayStartModal] cron check failed', err)
      }
    }

    check()
    return () => { cancelled = true }
  }, [session, authHeaders])

  const toggle = (id: string, locked: boolean) => {
    if (locked) return
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startNewDay = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/dailies/cron', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ completedIds: Array.from(checked) }),
      })
      const json = await res.json()

      if (json.data?.alreadyRan) {
        setIsOpen(false)
        return
      }
      setSummary(json.data)

      // Pull the freshly scored profile so XP/HP/level render correctly.
      const profileRes = await fetch('/api/user', { headers: authHeaders() })
      if (profileRes.ok) setProfile(await profileRes.json())
    } catch (err) {
      console.error('[DayStartModal] failed to start new day', err)
      setIsOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const checkedCount = checked.size

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/85 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md"
          >
            <SystemFrame title={summary ? 'Day Complete' : 'New Day'}>
              {summary ? (
                <DaySummary summary={summary} onClose={() => setIsOpen(false)} />
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 border border-border flex items-center justify-center">
                      <Sunrise size={26} className="text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Welcome back!</h2>
                    <p className="text-sm text-foreground-secondary mt-2">
                      {dailies.length > 0
                        ? 'Check off any Dailies you did yesterday:'
                        : 'Nothing was due yesterday. Ready when you are.'}
                    </p>
                  </div>

                  {dailies.length > 0 && (
                    <div className="max-h-[45vh] overflow-y-auto space-y-2 mb-6 -mx-1 px-1">
                      {dailies.map((daily) => {
                        const locked = daily.is_completed
                        const isChecked = checked.has(daily.id)
                        return (
                          <button
                            key={daily.id}
                            type="button"
                            onClick={() => toggle(daily.id, locked)}
                            disabled={locked}
                            className={`w-full flex items-center gap-3 rounded-lg border text-left transition-colors overflow-hidden ${
                              isChecked
                                ? 'border-primary/40 bg-primary/5'
                                : 'border-border bg-muted hover:border-primary/30'
                            } ${locked ? 'opacity-60 cursor-default' : ''}`}
                          >
                            <span
                              className={`w-1.5 self-stretch shrink-0 ${
                                PRIORITY_ACCENT[daily.priority] ?? 'bg-sky-400'
                              }`}
                            />
                            <span
                              className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${
                                isChecked ? 'bg-primary border-primary' : 'border-border'
                              }`}
                            >
                              {isChecked && <Check size={13} className="text-background" strokeWidth={3} />}
                            </span>
                            <span className="flex-1 min-w-0 py-3 pr-3">
                              <span className="block text-sm text-foreground truncate">{daily.title}</span>
                              <span className="flex items-center gap-2 mt-0.5">
                                {daily.scheduled_time && (
                                  <span className="text-[11px] text-foreground-secondary">
                                    {daily.scheduled_time}
                                  </span>
                                )}
                                {daily.current_streak > 0 && (
                                  <span className="flex items-center gap-0.5 text-[11px] text-orange-400">
                                    <Flame size={10} /> {daily.current_streak}
                                  </span>
                                )}
                                {locked && (
                                  <span className="text-[11px] text-primary/70">already done</span>
                                )}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {dailies.length > 0 && (
                    <p className="text-center text-[11px] text-foreground-secondary mb-4">
                      {checkedCount} of {dailies.length} checked
                      {checkedCount < dailies.length && ' — the rest will cost XP and HP'}
                    </p>
                  )}

                  <button
                    onClick={startNewDay}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl border border-border bg-primary/10 hover:bg-primary/15 active:scale-[0.98] transition-all text-sm font-medium text-foreground disabled:opacity-50 disabled:active:scale-100"
                  >
                    {submitting ? 'Running the day…' : 'Start My New Day!'}
                  </button>
                </>
              )}
            </SystemFrame>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function DaySummary({ summary, onClose }: { summary: CronSummary; onClose: () => void }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 border border-border flex items-center justify-center">
        {summary.perfectDay ? (
          <Flame size={26} className="text-orange-400" />
        ) : (
          <Sunrise size={26} className="text-primary" />
        )}
      </div>

      <h2 className="text-xl font-semibold text-foreground">
        {summary.perfectDay ? 'Perfect Day' : 'Day Recorded'}
      </h2>
      <p className="text-sm text-foreground-secondary mt-2 mb-6">
        {summary.completedCount} of {summary.totalDue} dailies completed on {summary.ranFor}.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <SummaryTile
          icon={<Zap size={16} className="text-primary" />}
          value={`+${summary.xpEarned}`}
          label="XP earned"
        />
        <SummaryTile
          icon={<Zap size={16} className="text-foreground-secondary" />}
          value={summary.xpLost > 0 ? `−${summary.xpLost}` : '0'}
          label="XP lost"
        />
        <SummaryTile
          icon={<Heart size={16} className="text-red-400" />}
          value={summary.hpLost > 0 ? `−${summary.hpLost}` : '0'}
          label="HP lost"
        />
      </div>

      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-xl border border-border bg-primary/10 hover:bg-primary/15 active:scale-[0.98] transition-all text-sm font-medium text-foreground"
      >
        Continue
      </button>
    </div>
  )
}

function SummaryTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="p-3 bg-muted border border-border rounded-xl">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] text-foreground-secondary mt-0.5">{label}</p>
    </div>
  )
}
