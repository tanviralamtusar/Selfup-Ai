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
  // Deactivate any existing active roadmap for this skill to enforce one-active rule
  await supabase
    .from('skill_roadmaps')
    .update({ status: 'deactivated' })
    .eq('skill_id', skillId)
    .eq('status', 'active')

  // Insert roadmap
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

  // Insert phases sequentially (need IDs for milestone FK), but batch milestones,
  // topics, and tests within each phase to cut round trips.
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

    if (!phaseData.milestones?.length) continue

    // Bulk insert all milestones for this phase in one round trip
    const { data: milestones, error: milestoneError } = await supabase
      .from('skill_milestones')
      .insert(
        phaseData.milestones.map(m => ({
          roadmap_id: roadmap.id,
          phase_id: phase.id,
          order_index: m.order_index,
          title: m.title,
          description: m.description,
          estimated_hours: m.estimated_hours,
          xp_reward: m.xp_reward
        }))
      )
      .select()

    if (milestoneError) throw milestoneError

    // Collect topics and test placeholders across all milestones, then bulk insert both
    const allTopics: object[] = []
    const allTests: object[] = []

    for (const [idx, milestoneData] of phaseData.milestones.entries()) {
      const milestone = milestones[idx]

      if (milestoneData.topics?.length) {
        allTopics.push(
          ...milestoneData.topics.map(t => ({
            milestone_id: milestone.id,
            order_index: t.order_index,
            title: t.title,
            type: t.type,
            estimated_minutes: t.estimated_minutes,
            xp_reward: t.xp_reward
          }))
        )
      }

      if (milestoneData.requires_test) {
        allTests.push({
          roadmap_id: roadmap.id,
          milestone_id: milestone.id,
          title: `${milestoneData.title} Assessment`,
          is_ad_hoc: false,
          questions: [],
          passing_score_pct: 70
        })
      }
    }

    if (allTopics.length) {
      const { error: topicError } = await supabase.from('skill_topics').insert(allTopics)
      if (topicError) throw topicError
    }

    if (allTests.length) {
      const { error: testError } = await supabase.from('milestone_tests').insert(allTests)
      if (testError) throw testError
    }
  }

  return { roadmapId: roadmap.id }
}
