'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flame, Star, Crown, Medal, Shield, Loader2, Users, UserPlus, Check, X, Clock, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn, formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

interface LeaderboardEntry {
  id: string
  rank: number
  username: string
  display_name: string | null
  avatar_url: string | null
  level: number
  total_xp: number
  streak_overall: number
  isCurrentUser: boolean
}

interface Friendship {
  id: string
  status: 'pending' | 'accepted' | 'blocked'
  direction: 'sent' | 'received'
  profile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    level: number
    xp: number
    streak_overall: number
  }
}

const RANK_CONFIG: Record<number, { icon: React.FC<any>; color: string; glow: string }> = {
  1: { icon: Crown,  color: 'text-amber-400',  glow: 'shadow-amber-500/20 bg-slate-950/40 border-amber-500/40' },
  2: { icon: Medal,  color: 'text-zinc-300',   glow: 'shadow-zinc-400/10 bg-slate-950/40 border-zinc-500/30' },
  3: { icon: Shield, color: 'text-orange-400', glow: 'shadow-orange-500/15 bg-slate-950/40 border-orange-500/30' },
}

function RankBadge({ rank }: { rank: number }) {
  const conf = RANK_CONFIG[rank]
  if (!conf) return <span className="text-xs font-black text-on-surface-variant/30 w-8 text-center">#{rank}</span>
  const Icon = conf.icon
  return (
    <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0", conf.glow)}>
      <Icon size={14} className={conf.color} />
    </div>
  )
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const displayName = entry.display_name || entry.username
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all backdrop-blur-md relative overflow-hidden",
        entry.isCurrentUser
          ? 'bg-blue-500/10 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
          : 'bg-slate-950/20 border-blue-500/10 hover:bg-slate-950/40 hover:border-blue-500/20'
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
      <RankBadge rank={entry.rank} />

      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 flex items-center justify-center font-black text-blue-400 text-sm border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)] relative z-10">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          : <User size={16} className="text-blue-400/80 system-text-glow" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-black truncate italic uppercase tracking-wider", entry.isCurrentUser ? 'text-blue-400 system-text-glow' : 'text-blue-100')}>
            {displayName}
          </p>
          {entry.isCurrentUser && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] italic text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">SELFUP ACCESS</span>
          )}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/40 italic">Vessel Rank: {entry.level}</p>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0 relative z-10">
        <p className="text-sm font-black text-blue-400 tabular-nums italic system-text-glow">{formatNumber(entry.total_xp)}</p>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/30 italic">Accumulated XP</p>
      </div>

      {/* Streak */}
      {entry.streak_overall > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Flame size={12} className="text-orange-400" />
          <span className="text-xs font-black text-orange-400">{entry.streak_overall}</span>
        </div>
      )}
    </motion.div>
  )
}

export default function LeaderboardPage() {
  const { profile, session } = useAuthStore()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [friends, setFriends] = useState<Friendship[]>([])
  const [selfProfile, setSelfProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'friends'>('leaderboard')
  const [friendUsername, setFriendUsername] = useState('')
  const [isSending, setIsSending] = useState(false)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  useEffect(() => {
    if (session?.access_token) fetchAll()
  }, [session])

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [lbRes, frRes] = await Promise.all([
        fetch('/api/social/leaderboard', { headers: headers() }),
        fetch('/api/social/friends', { headers: headers() })
      ])
      const [lbData, frData] = await Promise.all([lbRes.json(), frRes.json()])
      if (lbRes.ok) { setLeaderboard(lbData.leaderboard || []); setSelfProfile(lbData.selfProfile) }
      if (frRes.ok) setFriends(frData || [])
    } catch { toast.error('Failed to load social data') }
    finally { setIsLoading(false) }
  }

  const handleAddFriend = async () => {
    if (!friendUsername.trim()) return
    setIsSending(true)
    try {
      const res = await fetch('/api/social/friends', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ username: friendUsername.trim() })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Friend request sent to ${data.target?.display_name || data.target?.username}!`)
        setFriendUsername('')
        fetchAll()
      } else {
        toast.error(data.error || 'Failed to send request')
      }
    } catch { toast.error('Failed to send request') }
    finally { setIsSending(false) }
  }

  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const pendingFriends = friends.filter(f => f.status === 'pending')

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <Trophy size={28} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-4xl font-black font-headline tracking-[0.3em] italic text-blue-100 uppercase">Selfup Network</h1>
          <p className="text-blue-400/60 text-sm font-bold italic tracking-widest uppercase">Synchronize. Compete. Ascend the Ranks.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-950/40 rounded-2xl border border-blue-500/20 w-fit backdrop-blur-md">
        {[
          { id: 'leaderboard', label: 'Network Registry', icon: Trophy },
          { id: 'friends', label: 'Vessel Links', icon: Users },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] italic transition-all",
                activeTab === tab.id
                  ? 'bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-blue-500/20'
                  : 'text-blue-400/40 hover:text-blue-400'
              )}
            >
              <Icon size={14} />{tab.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : activeTab === 'leaderboard' ? (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          {leaderboard.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {leaderboard.slice(0, 3).map((entry, idx) => {
                const conf = RANK_CONFIG[entry.rank]
                const RIcon = conf?.icon || Medal
                const displayName = entry.display_name || entry.username
                const heights = ['h-32', 'h-24', 'h-20']
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "flex flex-col items-center justify-end p-4 rounded-3xl border text-center backdrop-blur-md relative overflow-hidden",
                      conf?.glow || 'bg-slate-950/40 border-blue-500/10',
                      { 'order-first lg:order-none': idx === 1 }
                    )}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
                    <div className={cn("w-14 h-14 rounded-2xl overflow-hidden bg-slate-950 border border-blue-500/20 flex items-center justify-center font-black text-blue-400 text-lg mb-2 relative z-10", heights[idx])}>
                      {entry.avatar_url
                        ? <img src={entry.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        : displayName[0]?.toUpperCase()
                      }
                    </div>
                    <RIcon size={16} className={cn("mb-1 relative z-10", conf?.color)} />
                    <p className="text-xs font-black text-blue-100 truncate w-full uppercase italic tracking-wider relative z-10">{displayName}</p>
                    <p className="text-[9px] font-black text-blue-400/40 uppercase tracking-[0.2em] italic relative z-10">Vessel Lv.{entry.level}</p>
                    <p className="text-sm font-black text-blue-400 mt-1 tabular-nums italic system-text-glow relative z-10">{formatNumber(entry.total_xp)} XP</p>
                  </motion.div>
                )
              })}
            </div>
          )}

          {leaderboard.length === 0 ? (
            <div className="py-24 text-center bg-slate-950/40 rounded-3xl border border-blue-500/20 backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <Trophy size={40} className="text-blue-500/10 mx-auto mb-4" />
              <h3 className="text-sm font-black text-blue-400/40 mb-2 italic uppercase tracking-[0.2em]">Network Registry is empty</h3>
              <p className="text-[10px] text-blue-400/20 italic uppercase tracking-[0.1em]">Enable public profile in Settings to appear in registry.</p>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-blue-500/20 rounded-3xl overflow-hidden backdrop-blur-md relative">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <div className="p-4 border-b border-blue-500/10 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/40 italic">Global Rankings</p>
              </div>
              <div className="divide-y divide-blue-500/5 p-2 relative z-10">
                {leaderboard.map(entry => <LeaderboardRow key={entry.id} entry={entry} />)}
              </div>

              {/* Self entry if not in list */}
              {selfProfile && !leaderboard.some(e => e.isCurrentUser) && (
                <div className="p-4 border-t border-blue-500/10 relative z-10">
                  <p className="text-[10px] text-blue-400/30 font-black uppercase tracking-widest text-center mb-2 italic">YOUR CURRENT STATUS</p>
                  <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <span className="text-xs font-black text-blue-400/20 w-8">—</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-blue-500/20 flex items-center justify-center font-black text-blue-400 text-sm">
                      {(selfProfile.display_name || selfProfile.username)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-blue-400 italic uppercase tracking-wider">{selfProfile.display_name || selfProfile.username}</p>
                      <p className="text-[9px] text-blue-400/40 uppercase tracking-[0.2em] font-black italic">PROFILE IS ENCRYPTED (PRIVATE)</p>
                    </div>
                    <Link href={ROUTES.SETTINGS} className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-cyan-400 transition-colors italic">DECRYPT PROFILE →</Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Friends Tab */
        <div className="space-y-6">
          {/* Add Friend */}
          <div className="bg-slate-950/40 border border-blue-500/20 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/40 mb-4 italic relative z-10">SEARCH VESSEL BY IDENTIFIER</p>
            <div className="flex gap-3 relative z-10">
              <input
                type="text"
                placeholder="@username"
                value={friendUsername}
                onChange={e => setFriendUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                className="flex-1 h-12 px-4 rounded-2xl bg-slate-950 border border-blue-500/20 text-blue-100 text-sm font-bold italic focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all placeholder:text-blue-500/10"
              />
              <button
                onClick={handleAddFriend}
                disabled={isSending || !friendUsername.trim()}
                className="px-6 h-12 rounded-2xl bg-blue-500 text-slate-950 font-black text-xs uppercase tracking-[0.3em] italic shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 hover:bg-blue-400 transition-all active:scale-95"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              </button>
            </div>
          </div>

          {/* Pending */}
          {pendingFriends.length > 0 && (
            <div className="bg-slate-950/40 border border-blue-500/20 rounded-3xl overflow-hidden backdrop-blur-md relative">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <div className="p-4 border-b border-blue-500/10 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/40 italic">
                  Pending Signals <span className="text-cyan-400 ml-1">{pendingFriends.length}</span>
                </p>
              </div>
              <div className="divide-y divide-blue-500/5 relative z-10">
                {pendingFriends.map(f => {
                  const p = f.profile
                  const name = p?.display_name || p?.username
                  return (
                    <div key={f.id} className="flex items-center gap-4 p-4 hover:bg-blue-500/5 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center font-black text-blue-400 text-sm border border-blue-500/20">
                        {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover rounded-xl" /> : name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-blue-100 italic uppercase tracking-wider truncate">{name}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/40 italic truncate">
                          {f.direction === 'sent' ? 'SIGNAL TRANSMITTED' : 'WANTS TO CONNECT'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <Clock size={12} className="text-blue-400/40" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/40 italic">PENDING</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Accepted Friends */}
          {acceptedFriends.length === 0 ? (
            <div className="py-24 text-center bg-slate-950/40 rounded-3xl border border-blue-500/20 backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <Users size={40} className="text-blue-500/10 mx-auto mb-4" />
              <h3 className="text-sm font-black text-blue-400/40 italic uppercase tracking-[0.2em]">No Vessel Links Established</h3>
              <p className="text-[10px] text-blue-400/20 italic uppercase tracking-[0.1em] mt-1">Search identifiers above to establish connections.</p>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-blue-500/20 rounded-3xl overflow-hidden backdrop-blur-md relative">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <div className="p-4 border-b border-blue-500/10 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/40 italic">Established Links <span className="text-cyan-400 ml-1">{acceptedFriends.length}</span></p>
              </div>
              <div className="divide-y divide-blue-500/5 relative z-10">
                {acceptedFriends.map(f => {
                  const p = f.profile
                  const name = p?.display_name || p?.username
                  return (
                    <div key={f.id} className="flex items-center gap-4 p-4 hover:bg-blue-500/5 transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center font-black text-blue-400 text-sm border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover rounded-xl" /> : name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-blue-100 italic uppercase tracking-wider truncate group-hover:text-blue-400 transition-colors">{name}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/40 italic truncate">Vessel Rank {p?.level}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-black text-blue-400 tabular-nums italic system-text-glow">{formatNumber(p?.xp || 0)} XP</p>
                        {(p?.streak_overall || 0) > 0 && (
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <Flame size={10} className="text-orange-400" />
                            <span className="text-[10px] font-black text-orange-400">{p?.streak_overall}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
