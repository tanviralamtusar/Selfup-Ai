import { useQuery } from '@tanstack/react-query'

export interface YoutubeVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  link: string
}

export function useYoutubeSearch(query: string | undefined) {
  return useQuery<YoutubeVideo[]>({
    queryKey: ['youtube-search', query],
    queryFn: async () => {
      if (!query) return []
      
      const response = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch YouTube videos')
      }

      return response.json()
    },
    enabled: !!query,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
