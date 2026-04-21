import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  avatar_type: 'rpg' | 'photo'
  rpg_avatar_key: string | null
  bio: string | null
  age: number | null
  gender: string | null
  timezone: string
  level: number
  xp: number
  xp_to_next_level: number
  total_xp: number
  ai_coins: number
  streak_overall: number
  streak_best: number
  streak_last_date: string | null
  streak_freeze_count: number
  is_pro: boolean
  onboarding_done: boolean
  ai_persona_name: string
  ai_persona_style: 'friendly' | 'strict' | 'motivational' | 'neutral'
  theme: 'dark' | 'light'
  is_public: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setSession: (session) => set({ session, isAuthenticated: !!session }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, profile: null, session: null, isAuthenticated: false }),
    }),
    {
      name: 'selfup-auth',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
