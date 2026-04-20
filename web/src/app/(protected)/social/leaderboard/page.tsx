'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flame, Star, Crown, Medal, Shield, Loader2, Users, UserPlus, Check, X, Clock } from 'lucide-react'
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
  1: { icon: Crown,  color: 'text-amber-400',  glow: 'shadow-amber-500/20 bg-amber-500/10 border-amber-500/20' },
  2: { icon: Medal,  color: 'text-zinc-300',   glow: 'shadow-zinc-400/10 bg-zinc-500/10 border-zinc-500/15' },
  3: { icon: Shield, color: 'text-orange-400', glow: 'shadow-orange-500/15 bg-orange-500/10 border-orange-500/15' },
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
        "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all",
        entry.isCurrentUser
          ? 'bg-primary/5 border-primary/20 shadow-sm shadow-primary/5'
          : 'bg-transparent border-transparent hover:bg-surface-container-medium/40 hover:border-outline-variant/10'
      )}
    >
      <RankBadge rank={entry.rank} />

      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-highest flex-shrink-0 flex items-center justify-center font-black text-primary text-sm border border-outline-variant/10">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          : displayName[0]?.toUpperCase()
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-black truncate", entry.isCurrentUser ? 'text-primary' : 'text-on-surface')}>
            {displayName}
          </p>
          {entry.isCurrentUser && (
            <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">You</span>
          )}
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Level {entry.level}</p>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-on-surface tabular-nums">{formatNumber(entry.total_xp)}</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/30">total xp</p>
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
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
          <Trophy size={28} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-on-surface">Social Hub</h1>
          <p className="text-on-surface-variant/60 text-sm">Compete. Connect. Climb the ranks.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 w-fit">
        {[
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'friends', label: 'Friends', icon: Users },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id
                  ? 'bg-surface-container text-on-surface shadow-sm'
                  : 'text-on-surface-variant/40 hover:text-on-surface-variant'
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
                      "flex flex-col items-center justify-end p-4 rounded-3xl border text-center",
                      conf?.glow || 'bg-surface-container-low border-outline-variant/10',
                      { 'order-first lg:order-none': idx === 1 }
                    )}
                  >
                    <div className={cn("w-14 h-14 rounded-2xl overflow-hidden bg-surface-container-highest border border-outline-variant/10 flex items-center justify-center font-black text-primary text-lg mb-2", heights[idx])}>
                      {entry.avatar_url
                        ? <img src={entry.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        : displayName[0]?.toUpperCase()
                      }
                    </div>
                    <RIcon size={16} className={cn("mb-1", conf?.color)} />
                    <p className="text-xs font-black text-on-surface truncate w-full">{displayName}</p>
                    <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">Lv.{entry.level}</p>
                    <p className="text-sm font-black text-primary mt-1 tabular-nums">{formatNumber(entry.total_xp)} XP</p>
                  </motion.div>
                )
              })}
            </div>
          )}

          {leaderboard.length === 0 ? (
            <div className="py-16 text-center bg-surface-container-low rounded-3xl border border-outline-variant/10">
              <Trophy size={40} className="text-on-surface-variant/10 mx-auto mb-4" />
              <h3 className="text-sm font-black text-on-surface-variant/30 mb-2">Leaderboard is empty</h3>
              <p className="text-xs text-on-surface-variant/20">Enable public profile in Settings to appear here.</p>
            </div>
          ) : (
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-outline-variant/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Global Rankings</p>
              </div>
              <div className="divide-y divide-outline-variant/5 p-2">
                {leaderboard.map(entry => <LeaderboardRow key={entry.id} entry={entry} />)}
              </div>

              {/* Self entry if not in list */}
              {selfProfile && !leaderboard.some(e => e.isCurrentUser) && (
                <div className="p-4 border-t border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant/30 font-black uppercase tracking-widest text-center mb-2">Your Position</p>
                  <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <span className="text-xs font-black text-on-surface-variant/30 w-8">—</span>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-highest border border-outline-variant/10 flex items-center justify-center font-black text-primary text-sm">
                      {(selfProfile.display_name || selfProfile.username)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1"><p className="text-sm font-black text-primary">{selfProfile.display_name || selfProfile.username}</p>
                    <p className="text-[9px] text-primary/60 uppercase tracking-widest font-black">Profile is private</p></div>
                    <Link href={ROUTES.SETTINGS} className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary">Make Public →</Link>
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
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-4">Add Friend by Username</p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="@username"
                value={friendUsername}
                onChange={e => setFriendUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                className="flex-1 h-12 px-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button
                onClick={handleAddFriend}
                disabled={isSending || !friendUsername.trim()}
                className="px-5 h-12 rounded-2xl bg-primary text-on-primary font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-primary/80 transition-all"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              </button>
            </div>
          </div>

          {/* Pending */}
          {pendingFriends.length > 0 && (
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-outline-variant/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  Pending <span className="text-primary ml-1">{pendingFriends.length}</span>
                </p>
              </div>
              <div className="divide-y divide-outline-variant/5">
                {pendingFriends.map(f => {
                  const p = f.profile
                  return (
                    <div key={f.id} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center font-black text-primary text-sm border border-outline-variant/10">
                        {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover rounded-xl" /> : (p?.display_name || p?.username)?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-on-surface">{p?.display_name || p?.username}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                          {f.direction === 'sent' ? 'Request sent' : 'Wants to connect'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-on-surface-variant/30" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30">Pending</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Accepted Friends */}
          {acceptedFriends.length === 0 ? (
            <div className="py-16 text-center bg-surface-container-low rounded-3xl border border-outline-variant/10">
              <Users size={40} className="text-on-surface-variant/10 mx-auto mb-4" />
              <h3 className="text-sm font-black text-on-surface-variant/30">No friends yet</h3>
              <p className="text-xs text-on-surface-variant/20 mt-1">Search by username above to connect.</p>
            </div>
          ) : (
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-outline-variant/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Friends <span className="text-primary ml-1">{acceptedFriends.length}</span></p>
              </div>
              <div className="divide-y divide-outline-variant/5">
                {acceptedFriends.map(f => {
                  const p = f.profile
                  return (
                    <div key={f.id} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center font-black text-primary text-sm border border-outline-variant/10">
                        {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover rounded-xl" /> : (p?.display_name || p?.username)?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-on-surface">{p?.display_name || p?.username}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Level {p?.level}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-primary tabular-nums">{formatNumber(p?.xp || 0)} XP</p>
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
