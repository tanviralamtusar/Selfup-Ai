import { SupabaseClient } from '@supabase/supabase-js'
import { generateResponse } from '../gemma'
import { getUserModelConfig } from '../model-config'
import type { SkillInterviewData, GeneratedRoadmap, RoadmapPlanType } from '@/types/skills'

export async function generateSkillRoadmap(
  userId: string,
  interviewData: SkillInterviewData,
  supabase: SupabaseClient
): Promise<GeneratedRoadmap> {
  const modelConfig = await getUserModelConfig(userId)
  
  const prompt = `You are an elite AI mentor following the "Scholar Protocol".
The user wants to learn a new skill. Based on their interview data, generate a comprehensive learning roadmap.

Interview Data:
- Skill: ${interviewData.skill_name}
- Current Level: ${interviewData.current_level}
- Goal: ${interviewData.goal}
- Learning Style: ${interviewData.preferred_learning_style}
- Time Commitment: ${interviewData.time_commitment_hours_per_week} hours/week
- Project Based: ${interviewData.project_based}
- Needs Certification: ${interviewData.needs_certification}

Plan Type constraints:
- "crash_course": 1 phase, ~2-4 weeks, high intensity.
- "standard": 2-3 phases, ~8-12 weeks, balanced.
- "deep_dive": 3-5 phases, ~6+ months, comprehensive mastery.
Infer the plan type from their goal and time commitment.

Output the roadmap strictly as a valid JSON object matching this structure:
{
  "title": "String",
  "goal": "String",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "plan_type": "crash_course" | "standard" | "deep_dive",
  "estimated_weeks": Number,
  "daily_study_minutes": Number,
  "includes_tests": Boolean,
  "phases": [
    {
      "phase_number": Number,
      "phase_name": "String",
      "estimated_weeks": Number,
      "xp_bonus": Number,
      "milestones": [
        {
          "order_index": Number,
          "title": "String",
          "description": "String",
          "estimated_hours": Number,
          "xp_reward": Number,
          "requires_test": Boolean,
          "topics": [
            {
              "order_index": Number,
              "title": "String",
              "type": "theory" | "practical" | "project" | "quiz",
              "estimated_minutes": Number,
              "xp_reward": Number,
              "search_queries": ["String"]
            }
          ]
        }
      ]
    }
  ]
}

Make sure to include specific "search_queries" for each topic that can be used to find YouTube videos or articles. Do not include markdown formatting or additional text outside of the JSON object.`

  console.log(`[RoadmapGenerator] Requesting generation for skill: ${interviewData.skill_name}`)
  
  const rawResponse = await generateResponse(prompt, [], undefined, modelConfig.background_model, 'plan_generation')
  
  if (!rawResponse) {
    throw new Error('Failed to generate roadmap: No response from AI')
  }

  const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
  
  try {
    const roadmap = JSON.parse(cleanJson) as GeneratedRoadmap
    return roadmap
  } catch (err) {
    console.error('[RoadmapGenerator] JSON parse error:', err, cleanJson)
    throw new Error('Failed to parse AI roadmap response')
  }
}

export async function saveRoadmapToDb(
  userId: string,
  roadmapData: GeneratedRoadmap,
  skillId: string,
  aicoinCost: number,
  supabase: SupabaseClient
) {
  // Insert Roadmap
  const { data: roadmap, error: roadmapError } = await supabase
    .from('skill_roadmaps')
    .insert({
      user_id: userId,
      skill_id: skillId,
      title: roadmapData.title,
      goal: roadmapData.goal,
      difficulty: roadmapData.difficulty,
      plan_type: roadmapData.plan_type,
      daily_study_minutes: roadmapData.daily_study_minutes,
      includes_tests: roadmapData.includes_tests,
      is_ai_generated: true,
      status: 'active',
      aicoin_cost: aicoinCost
    })
    .select()
    .single()

  if (roadmapError) throw roadmapError

  for (const phaseData of roadmapData.phases) {
    const { data: phase, error: phaseError } = await supabase
      .from('skill_phases')
      .insert({
        roadmap_id: roadmap.id,
        phase_number: phaseData.phase_number,
        phase_name: phaseData.phase_name,
        estimated_weeks: phaseData.estimated_weeks,
        xp_bonus: phaseData.xp_bonus
      })
      .select()
      .single()

    if (phaseError) throw phaseError

    for (const milestoneData of phaseData.milestones) {
      const { data: milestone, error: milestoneError } = await supabase
        .from('skill_milestones')
        .insert({
          roadmap_id: roadmap.id,
          phase_id: phase.id,
          order_index: milestoneData.order_index,
          title: milestoneData.title,
          description: milestoneData.description,
          estimated_hours: milestoneData.estimated_hours,
          xp_reward: milestoneData.xp_reward
        })
        .select()
        .single()

      if (milestoneError) throw milestoneError

      if (milestoneData.topics && milestoneData.topics.length > 0) {
        const topicsToInsert = milestoneData.topics.map(t => ({
          milestone_id: milestone.id,
          order_index: t.order_index,
          title: t.title,
          type: t.type,
          estimated_minutes: t.estimated_minutes,
          xp_reward: t.xp_reward
        }))

        const { data: insertedTopics, error: topicError } = await supabase
          .from('skill_topics')
          .insert(topicsToInsert)
          .select()

        if (topicError) throw topicError
        
        // Let's create an initial mapping for resources, they will be resolved later lazily
      }
      
      if (milestoneData.requires_test) {
         // Create a placeholder for the test
         await supabase.from('milestone_tests').insert({
             roadmap_id: roadmap.id,
             milestone_id: milestone.id,
             title: `${milestoneData.title} Assessment`,
             is_ad_hoc: false,
             questions: [], // Will be generated when the test is started
             passing_score_pct: 70
         })
      }
    }
  }

  return { roadmapId: roadmap.id }
}
