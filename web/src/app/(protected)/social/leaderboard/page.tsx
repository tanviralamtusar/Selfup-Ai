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
  1: { icon: Crown,  color: 'text-amber-400',  glow: 'bg-amber-500/10 border-amber-500/30' },
  2: { icon: Medal,  color: 'text-muted-foreground', glow: 'bg-muted border-border' },
  3: { icon: Shield, color: 'text-orange-400', glow: 'bg-orange-500/10 border-orange-500/30' },
}

function RankBadge({ rank }: { rank: number }) {
  const conf = RANK_CONFIG[rank]
  if (!conf) return <span className="text-xs  text-muted-foreground w-8 text-center">#{rank}</span>
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
        "flex items-center gap-4 px-5 py-4 rounded-xl border transition-all  relative overflow-hidden",
        entry.isCurrentUser
          ? 'bg-primary/10 border-border '
          : 'bg-background/20 border-border hover:bg-card hover:border-border'
      )}
    >
      <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
      <RankBadge rank={entry.rank} />

      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-background flex-shrink-0 flex items-center justify-center  text-primary text-sm border border-border  relative z-10">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          : <User size={16} className="text-primary/80" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm  truncate ", entry.isCurrentUser ? 'text-primary' : 'text-foreground')}>
            {displayName}
          </p>
          {entry.isCurrentUser && (
            <span className="text-[9px]    text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-border">SELFUP ACCESS</span>
          )}
        </div>
        <p className="text-[10px]   text-primary/40 ">Vessel Rank: {entry.level}</p>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0 relative z-10">
        <p className="text-sm  text-primary tabular-nums ">{formatNumber(entry.total_xp)}</p>
        <p className="text-[9px]   text-primary/30 ">Accumulated XP</p>
      </div>

      {/* Streak */}
      {entry.streak_overall > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Flame size={12} className="text-orange-400" />
          <span className="text-xs  text-orange-400">{entry.streak_overall}</span>
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
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-border ">
          <Trophy size={28} className="text-primary" />
        </div>
        <div>
          <h1 className="text-4xl  font-headline   text-foreground">Selfup Network</h1>
          <p className="text-primary/60 text-sm font-medium ">Synchronize. Compete. Ascend the Ranks.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-card rounded-xl border border-border w-fit ">
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
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px]    transition-all",
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary  border border-border'
                  : 'text-primary/40 hover:text-primary'
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
                      "flex flex-col items-center justify-end p-4 rounded-xl border text-center  relative overflow-hidden",
                      conf?.glow || 'bg-card border-border',
                      { 'order-first lg:order-none': idx === 1 }
                    )}
                  >
                    <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
                    <div className={cn("w-14 h-14 rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center  text-primary text-lg mb-2 relative z-10", heights[idx])}>
                      {entry.avatar_url
                        ? <img src={entry.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        : displayName[0]?.toUpperCase()
                      }
                    </div>
                    <RIcon size={16} className={cn("mb-1 relative z-10", conf?.color)} />
                    <p className="text-xs  text-foreground truncate w-full  relative z-10">{displayName}</p>
                    <p className="text-[9px]  text-primary/40   relative z-10">Vessel Lv.{entry.level}</p>
                    <p className="text-sm  text-primary mt-1 tabular-nums  relative z-10">{formatNumber(entry.total_xp)} XP</p>
                  </motion.div>
                )
              })}
            </div>
          )}

          {leaderboard.length === 0 ? (
            <div className="py-24 text-center bg-card rounded-xl border border-border  relative overflow-hidden">
              <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
              <Trophy size={40} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-sm  text-primary/40 mb-2  ">Network Registry is empty</h3>
              <p className="text-[10px] text-primary/20  ">Enable public profile in Settings to appear in registry.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden  relative">
              <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
              <div className="p-4 border-b border-border relative z-10">
                <p className="text-[10px]   text-primary/40 ">Global Rankings</p>
              </div>
              <div className="divide-y divide-border p-2 relative z-10">
                {leaderboard.map(entry => <LeaderboardRow key={entry.id} entry={entry} />)}
              </div>

              {/* Self entry if not in list */}
              {selfProfile && !leaderboard.some(e => e.isCurrentUser) && (
                <div className="p-4 border-t border-border relative z-10">
                  <p className="text-[10px] text-primary/30  text-center mb-2 ">YOUR CURRENT STATUS</p>
                  <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-muted border border-border">
                    <span className="text-xs  text-primary/20 w-8">—</span>
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center  text-primary text-sm">
                      {(selfProfile.display_name || selfProfile.username)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm  text-primary ">{selfProfile.display_name || selfProfile.username}</p>
                      <p className="text-[9px] text-primary/40   ">PROFILE IS ENCRYPTED (PRIVATE)</p>
                    </div>
                    <Link href={ROUTES.SETTINGS} className="text-[10px]  text-primary hover:text-[#5db8a0] transition-colors ">DECRYPT PROFILE →</Link>
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
          <div className="bg-card border border-border rounded-xl p-6  relative overflow-hidden">
            <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
            <p className="text-[10px]   text-primary/40 mb-4  relative z-10">SEARCH VESSEL BY IDENTIFIER</p>
            <div className="flex gap-3 relative z-10">
              <input
                type="text"
                placeholder="@username"
                value={friendUsername}
                onChange={e => setFriendUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                className="flex-1 h-12 px-4 rounded-xl bg-background border border-border text-foreground text-sm font-medium  focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
              />
              <button
                onClick={handleAddFriend}
                disabled={isSending || !friendUsername.trim()}
                className="px-6 h-12 rounded-xl bg-primary text-foreground  text-xs    disabled:opacity-50 hover:bg-primary/90 transition-all active:scale-95"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              </button>
            </div>
          </div>

          {/* Pending */}
          {pendingFriends.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden  relative">
              <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
              <div className="p-4 border-b border-border relative z-10">
                <p className="text-[10px]   text-primary/40 ">
                  Pending Signals <span className="text-[#5db8a0] ml-1">{pendingFriends.length}</span>
                </p>
              </div>
              <div className="divide-y divide-border relative z-10">
                {pendingFriends.map(f => {
                  const p = f.profile
                  const name = p?.display_name || p?.username
                  return (
                    <div key={f.id} className="flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center  text-primary text-sm border border-border">
                        {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover rounded-xl" /> : name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm  text-foreground  truncate">{name}</p>
                        <p className="text-[10px]   text-primary/40  truncate">
                          {f.direction === 'sent' ? 'SIGNAL TRANSMITTED' : 'WANTS TO CONNECT'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
                        <Clock size={12} className="text-primary/40" />
                        <span className="text-[9px]   text-primary/40 ">PENDING</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Accepted Friends */}
          {acceptedFriends.length === 0 ? (
            <div className="py-24 text-center bg-card rounded-xl border border-border  relative overflow-hidden">
              <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
              <Users size={40} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-sm  text-primary/40  ">No Vessel Links Established</h3>
              <p className="text-[10px] text-primary/20   mt-1">Search identifiers above to establish connections.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden  relative">
              <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
              <div className="p-4 border-b border-border relative z-10">
                <p className="text-[10px]   text-primary/40 ">Established Links <span className="text-[#5db8a0] ml-1">{acceptedFriends.length}</span></p>
              </div>
              <div className="divide-y divide-border relative z-10">
                {acceptedFriends.map(f => {
                  const p = f.profile
                  const name = p?.display_name || p?.username
                  return (
                    <div key={f.id} className="flex items-center gap-4 p-4 hover:bg-muted transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center  text-primary text-sm border border-border ">
                        {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover rounded-xl" /> : name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm  text-foreground  truncate group-hover:text-primary transition-colors">{name}</p>
                        <p className="text-[10px]   text-primary/40  truncate">Vessel Rank {p?.level}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs  text-primary tabular-nums ">{formatNumber(p?.xp || 0)} XP</p>
                        {(p?.streak_overall || 0) > 0 && (
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <Flame size={10} className="text-orange-400" />
                            <span className="text-[10px]  text-orange-400">{p?.streak_overall}</span>
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
