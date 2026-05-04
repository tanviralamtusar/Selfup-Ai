import { SupabaseClient } from '@supabase/supabase-js'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || ''

/**
 * YouTube Integration — Two-Layer Video System
 * Layer 1: Pre-built exercise library (DB lookup, zero API cost)
 * Layer 2: YouTube Data API v3 fallback (cached back to library)
 */

export async function getExerciseVideo(
  exerciseName: string,
  supabase: SupabaseClient
): Promise<{ url: string | null; title: string | null; source: 'library' | 'youtube_api' | null }> {
  // Layer 1: Check exercise library
  const { data: libraryMatch } = await supabase
    .from('exercises')
    .select('video_url, video_title, video_source')
    .ilike('name', exerciseName)
    .not('video_url', 'is', null)
    .limit(1)
    .maybeSingle()

  if (libraryMatch?.video_url) {
    return {
      url: libraryMatch.video_url,
      title: libraryMatch.video_title,
      source: libraryMatch.video_source as 'library' | 'youtube_api',
    }
  }

  // Layer 2: YouTube API fallback
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube] No API key set, skipping video lookup for:', exerciseName)
    return { url: null, title: null, source: null }
  }

  try {
    const query = `how to do ${exerciseName} proper form technique`
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '1',
      videoDuration: 'short',
      relevanceLanguage: 'en',
      key: YOUTUBE_API_KEY,
    })

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    )

    if (!response.ok) {
      console.error('[YouTube] API error:', response.status, await response.text())
      return { url: null, title: null, source: null }
    }

    const data = await response.json()

    if (data.items && data.items.length > 0) {
      const item = data.items[0]
      const videoUrl = `https://youtube.com/watch?v=${item.id.videoId}`
      const videoTitle = item.snippet?.title || exerciseName

      // Cache result back to library
      await cacheExerciseVideo(exerciseName, videoUrl, videoTitle, supabase)

      return { url: videoUrl, title: videoTitle, source: 'youtube_api' }
    }

    return { url: null, title: null, source: null }
  } catch (error) {
    console.error('[YouTube] Fetch error for:', exerciseName, error)
    return { url: null, title: null, source: null }
  }
}

/**
 * Cache a YouTube API result back to the exercises table
 * to avoid future API calls for the same exercise
 */
async function cacheExerciseVideo(
  exerciseName: string,
  videoUrl: string,
  videoTitle: string,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from('exercises')
    .update({
      video_url: videoUrl,
      video_title: videoTitle,
      video_source: 'youtube_api',
    })
    .ilike('name', exerciseName)

  if (error) {
    console.error('[YouTube] Failed to cache video for:', exerciseName, error)
  } else {
    console.log(`[YouTube] Cached video for ${exerciseName}: ${videoUrl}`)
  }
}

/**
 * Batch fetch videos for multiple exercises
 * Prioritizes library lookups, only calls YouTube API for misses
 */
export async function batchGetExerciseVideos(
  exerciseNames: string[],
  supabase: SupabaseClient
): Promise<Map<string, { url: string; title: string }>> {
  const results = new Map<string, { url: string; title: string }>()

  for (const name of exerciseNames) {
    const video = await getExerciseVideo(name, supabase)
    if (video.url) {
      results.set(name, { url: video.url, title: video.title || name })
    }
  }

  return results
}
