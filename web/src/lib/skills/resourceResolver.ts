import { SupabaseClient } from '@supabase/supabase-js'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || ''

export async function resolveSkillResource(
  topicName: string,
  skillCategory: string,
  searchQuery: string,
  supabase: SupabaseClient
): Promise<{ url: string | null; title: string | null; source: 'library' | 'youtube_api' | null }> {
  // Layer 1: Check curated resource library
  const { data: libraryMatch } = await supabase
    .from('resource_library')
    .select('url, title, source')
    .ilike('topic_name', topicName)
    .ilike('skill_category', skillCategory)
    .limit(1)
    .maybeSingle()

  if (libraryMatch?.url) {
    return {
      url: libraryMatch.url,
      title: libraryMatch.title,
      source: libraryMatch.source as 'library' | 'youtube_api',
    }
  }

  // Layer 2: YouTube API fallback
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube] No API key set, skipping video lookup for:', searchQuery)
    return { url: null, title: null, source: null }
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: '1',
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
      const videoTitle = item.snippet?.title || searchQuery

      // Cache result back to library
      await cacheSkillResource(skillCategory, topicName, videoUrl, videoTitle, supabase)

      return { url: videoUrl, title: videoTitle, source: 'youtube_api' }
    }

    return { url: null, title: null, source: null }
  } catch (error) {
    console.error('[YouTube] Fetch error for:', searchQuery, error)
    return { url: null, title: null, source: null }
  }
}

async function cacheSkillResource(
  skillCategory: string,
  topicName: string,
  videoUrl: string,
  videoTitle: string,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from('resource_library')
    .insert({
      skill_category: skillCategory,
      topic_name: topicName,
      title: videoTitle,
      url: videoUrl,
      resource_type: 'video',
      source: 'youtube_api',
    })

  if (!error) {
    console.log(`[YouTube] Cached resource for ${topicName}: ${videoUrl}`)
    return
  }

  // 23505 = unique_violation — another concurrent request already cached this topic; safe to ignore
  if (error.code !== '23505') {
    console.error('[YouTube] Failed to cache skill resource for:', topicName, error)
  }
}

export async function batchResolveSkillResources(
  queries: { topicName: string; skillCategory: string; searchQuery: string }[],
  supabase: SupabaseClient
): Promise<Map<string, { url: string; title: string }>> {
  const results = new Map<string, { url: string; title: string }>()

  for (const { topicName, skillCategory, searchQuery } of queries) {
    const video = await resolveSkillResource(topicName, skillCategory, searchQuery, supabase)
    if (video.url) {
      results.set(topicName, { url: video.url, title: video.title || searchQuery })
    }
  }

  return results
}
