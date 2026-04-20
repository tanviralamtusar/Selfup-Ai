import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { query } = await req.json()
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // IF API KEY IS MISSING OR INVALID, RETURN STYLIZED MOCK DATA
    if (!YOUTUBE_API_KEY) {
      console.warn('[YouTube API] No YOUTUBE_API_KEY found, returning MOCK data for query:', query)
      
      // Artificial delay for realism
      await new Promise(r => setTimeout(r, 600))
      
      return NextResponse.json([
        {
          id: 'mock_1',
          title: `${query} in 100 Seconds`,
          channelTitle: 'Fireship',
          thumbnail: 'https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?q=80&w=400&h=300&fit=crop',
          link: 'https://youtube.com'
        },
        {
          id: 'mock_2',
          title: `Full Course: ${query} for Beginners`,
          channelTitle: 'FreeCodeCamp',
          thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=400&h=300&fit=crop',
          link: 'https://youtube.com'
        },
        {
          id: 'mock_3',
          title: `Why ${query} is the future!`,
          channelTitle: 'Tech Creator',
          thumbnail: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=400&h=300&fit=crop',
          link: 'https://youtube.com'
        }
      ])
    }

    // REAL YOUTUBE DATA API IMPLEMENTATION
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.append('part', 'snippet')
    url.searchParams.append('q', query + ' tutorial')
    url.searchParams.append('type', 'video')
    url.searchParams.append('maxResults', '3')
    url.searchParams.append('key', YOUTUBE_API_KEY)

    const result = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (!result.ok) {
      const errText = await result.text()
      console.error('[YouTube API] Received bad response:', errText)
      throw new Error('Failed to fetch from YouTube')
    }

    const data = await result.json()

    // Map the complex YT response into an easy-to-use frontend structure
    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }))

    return NextResponse.json(videos)
  } catch (err: any) {
    console.error('[YouTube Endpoint Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
