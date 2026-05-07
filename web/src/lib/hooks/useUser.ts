import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

export interface Badge {
  id: string
  name: string
  icon: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earned_at: string
}

export function useUserBadges() {
  const { session } = useAuthStore()

  return useQuery({
    queryKey: ['user-badges', session?.user?.id],
    queryFn: async (): Promise<Badge[]> => {
      if (!session?.access_token) return []

      const res = await fetch('/api/user/badges', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch badges')
      
      // API now returns { success: true, data: [...] }
      return json.data || []
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
