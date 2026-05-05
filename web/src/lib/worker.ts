import type { Worker, Job } from 'bullmq'

import { redis } from '@/lib/redis'
import { AiJobData } from './queue'
import { generateResponse } from './gemma'
import { supabase } from './supabase'
import { generateFitnessPlan, savePlanToDb, deactivateExistingPlan } from './fitness/planGenerator'
import { checkAvailability } from './fitness/calendarCheck'
import { injectWorkoutDailies, injectDietHabits } from './fitness/dailyInjector'
import { analyzePerformance, suggestAdjustment } from './fitness/adaptationEngine'
import { GamificationService } from './gamification.service'
import { BadgeService } from './badge.service'
import { getUserModelConfig, AICOIN_COSTS } from './model-config'
import { embedAndStoreMessage, extractAndSaveMemory } from './ai-memory'
import type { FitnessInterviewData } from '@/types/fitness'

const AI_QUEUE_NAME = 'ai-tasks'

export async function executeAiTask(data: AiJobData) {
  const { userId, type, payload } = data

  console.log(`[AI Task] Processing ${type} for user ${userId}`)

  try {

    // Get user's model config
    const modelConfig = await getUserModelConfig(userId)

    // 2. Perform AI Task
    let result = ''
    switch (type) {
      case 'roadmap': {
        const prompt = `You are a world-class mentor. Generate a structured learning roadmap for the skill: "${payload.skillName}" in the category: "${payload.category || 'General'}". 
        Target level: ${payload.targetLevel || 'Mastery'}.
        The roadmap should consist of 8-10 specific, actionable milestones.
        Respond ONLY with a valid JSON array of objects, each with these exact keys: "title", "description", "estimated_hours".
        Do not include any intro or outro text.`
        
        const rawResponse = await generateResponse(prompt, [], undefined, modelConfig.background_model, 'plan_generation')
        if (!rawResponse) throw new Error('No response from AI');
        
        const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
        let milestones = []
        try {
          milestones = JSON.parse(cleanJson)
        } catch (pErr) {
          console.error('[AI Worker] JSON Parse Error:', pErr, cleanJson)
          throw new Error('Failed to parse AI roadmap response')
        }

        const { data: roadmap, error: roadmapError } = await supabase
          .from('skill_roadmaps')
          .insert({
            skill_id: payload.skillId,
            title: `${payload.skillName} Growth Path`,
            description: `AI-generated roadmap to master ${payload.skillName}.`,
            is_ai_generated: true
          })
          .select()
          .single()
        
        if (roadmapError) throw roadmapError

        const milestoneEntries = milestones.map((m: any, idx: number) => ({
          roadmap_id: roadmap.id,
          title: m.title,
          description: m.description,
          order_index: idx + 1,
          estimated_hours: m.estimated_hours || 1,
          is_completed: false
        }))

        const { error: milestoneError } = await supabase
          .from('skill_milestones')
          .insert(milestoneEntries)
        
        if (milestoneError) throw milestoneError

        result = `Success: Generated roadmap with ${milestones.length} milestones.`
        break
      }
      case 'style_advice': {
        const prompt = `You are an elite fashion AI stylist.
        The user needs an outfit for this occasion: "${payload.occasion}".
        Their body type: "${payload.body_type}".
        Style preferences: "${(payload.style_preferences || []).join(', ')}".
        Budget: "${payload.budget_range}".
        
        Create a coordinated look with 4 items: Top, Bottom, Shoes, Accessory.
        Return ONLY a valid JSON array of objects, where each object has:
        "type" (e.g. "top", "bottom", "shoes", "accessory"),
        "name" (specific name of the item),
        "description" (why it works),
        "color",
        "estimated_price" (a number matching the budget).
        No markdown blocks, no intro, no outro, strictly JSON.`

        const rawResponse = await generateResponse(prompt, [], undefined, modelConfig.background_model, 'plan_generation')
        if (!rawResponse) throw new Error('No response from AI');
        const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
        let items = []
        try {
          items = JSON.parse(cleanJson)
        } catch (pErr) {
          console.error('[AI Worker] Style JSON Parse Error:', pErr, cleanJson)
          throw new Error('Failed to parse style AI response')
        }

        const { error: styleError } = await supabase
          .from('style_recommendations')
          .insert({
            user_id: userId,
            occasion: payload.occasion,
            items: items,
            is_ai_generated: true,
            rating: null
          })

        if (styleError) throw styleError

        result = `Success: Generated style with ${items.length} items.`
        break
      }
      case 'fitness_plan':
      case 'fitness_plan_v2':
      case 'fitness_interview_complete': {
        const interviewData = payload as FitnessInterviewData;
        
        let conflicts: string[] = [];
        if (interviewData.preferred_time) {
          const { conflicts: c } = await checkAvailability(
            userId, 
            'mon',
            interviewData.preferred_time,
            interviewData.session_duration_minutes || 60,
            supabase
          );
          conflicts = c.map(x => `${x.title} at ${x.time}`);
        }

        const generatedPlan = await generateFitnessPlan(interviewData, conflicts);
        await deactivateExistingPlan(userId, interviewData.plan_type || 'ongoing', supabase);
        const { planId, dietPlanId } = await savePlanToDb(userId, generatedPlan, supabase);

        await injectWorkoutDailies(userId, planId, generatedPlan, supabase);
        if (dietPlanId && generatedPlan.diet_plan) {
           await injectDietHabits(userId, planId, generatedPlan.diet_plan, interviewData.plan_type !== 'fixed', null, supabase);
        }

        const gamification = new GamificationService(supabase);
        await gamification.addCoins(userId, -AICOIN_COSTS.fitness_protocol, 'Fitness Plan Generation');

        const badgeService = new BadgeService(supabase);
        await badgeService.awardBadge(userId, 'first_protocol');

        result = `Success: Generated and activated fitness plan ${generatedPlan.plan_meta.name}.`;
        
        break;
      }
      case 'fitness_adaptation_check': {
        const { planId } = payload;
        const analysis = await analyzePerformance(userId, planId, supabase);
        if (analysis.needsAdjustment) {
          await suggestAdjustment(userId, planId, analysis, supabase);
          result = `Success: Suggested adjustment for plan ${planId} (${analysis.reason}).`;
        } else {
          result = `Success: Checked plan ${planId}, no adjustment needed.`;
        }
        break;
      }
      case 'initial_plan': {
        const prompt = `You are System, an elite AI life coach.
        A new user has just completed onboarding.
        Their goals: ${(payload.goals || []).join(', ')}.
        Their preferred interaction style: ${payload.persona}.
        Their answers to your onboarding questions: ${JSON.stringify(payload.answers || {})}.

        Generate an initial starter plan consisting of a few easy-to-start habits, tasks, and quests.
        Return ONLY a valid JSON object with the following structure:
        {
          "habits": [
            { "title": "Drink Water", "description": "Start the day with a glass of water", "frequency": "daily", "target_days": [0,1,2,3,4,5,6] }
          ],
          "tasks": [
            { "title": "Setup workspace", "category": "productivity" }
          ],
          "quests": [
            { "title": "First Steps", "description": "Complete your first task and habit to earn this." }
          ]
        }
        Generate 2-3 habits, 2-3 tasks, and 1 starter quest.
        Do not include any markdown blocks or text outside JSON. Strictly valid JSON.`

        const rawResponse = await generateResponse(prompt, [], undefined, modelConfig.background_model, 'plan_generation')
        if (!rawResponse) throw new Error('No response from AI');
        const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
        let initPlan = null
        try {
          initPlan = JSON.parse(cleanJson)
        } catch (err) {
          console.error('[AI Worker] Initial Plan JSON Parse Error:', err, cleanJson)
          throw new Error('Failed to parse initial plan AI response')
        }

        if (initPlan.habits && initPlan.habits.length > 0) {
          const habitEntries = initPlan.habits.map((h: any) => ({
            user_id: userId,
            title: h.title,
            description: h.description,
            frequency: h.frequency || 'daily',
            target_days: h.target_days || [0,1,2,3,4,5,6],
            xp_reward: 5,
            coin_reward: 2,
            is_active: true
          }))
          await supabase.from('habits').insert(habitEntries)
        }

        if (initPlan.tasks && initPlan.tasks.length > 0) {
          const taskEntries = initPlan.tasks.map((t: any) => ({
            user_id: userId,
            title: t.title,
            category: t.category || 'general',
            priority: 'medium',
            is_completed: false,
            xp_reward: 10,
            xp_penalty: 5
          }))
          await supabase.from('todos').insert(taskEntries)
        }

        if (initPlan.quests && initPlan.quests.length > 0) {
          for (const q of initPlan.quests) {
            const { data: questRow, error: questError } = await supabase
              .from('quests')
              .insert({
                user_id: userId,
                title: q.title,
                description: q.description,
                category: 'general',
                quest_type: 'solo',
                is_ai_generated: true,
                xp_reward: 50,
                coin_reward: 20,
                duration_days: 3
              })
              .select()
              .single()

            if (!questError && questRow) {
              await supabase.from('user_quests').insert({
                user_id: userId,
                quest_id: questRow.id,
                status: 'active'
              })
            }
          }
        }

        result = 'Success: Initial plan generated.'
        break
      }

      // ─── V3 Job Types ────────────────────────────
      case 'weekly_summary_generate': {
        const summaryPrompt = `Generate a weekly performance summary for a self-improvement app user.
Period: ${payload.period_start} to ${payload.period_end}.
Return a JSON object with these keys:
{
  "highlights": ["top win 1", "top win 2", "top win 3"],
  "ai_observation": "2-3 sentence coaching note",
  "focus_recommendation": "what to focus on next week"
}
Strictly valid JSON. No markdown.`

        const rawResponse = await generateResponse(summaryPrompt, [], undefined, modelConfig.background_model, 'weekly_summary')
        if (!rawResponse) throw new Error('No response from AI')

        const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
        let summaryContent = {}
        try {
          summaryContent = JSON.parse(cleanJson)
        } catch {
          summaryContent = { highlights: [], ai_observation: rawResponse, focus_recommendation: '' }
        }

        await supabase.from('ai_weekly_summaries').insert({
          user_id: userId,
          period_start: payload.period_start,
          period_end: payload.period_end,
          content: summaryContent,
        })

        result = 'Success: Weekly summary generated.'
        break
      }

      case 'embed_message': {
        await embedAndStoreMessage(
          userId,
          payload.conversationId,
          payload.messageId,
          payload.content,
          payload.role
        )
        result = 'Success: Message embedded.'
        break
      }

      case 'memory_extraction': {
        await extractAndSaveMemory(userId, payload.userMessage, payload.aiResponse)
        result = 'Success: Memory extraction complete.'
        break
      }

      default:
        result = (await generateResponse(`Assistant request: ${type} with data: ${JSON.stringify(payload)}`, [], undefined, modelConfig.background_model)) || 'No response';
    }

    return result
  } catch (err: any) {
    console.error(`[AI Task Error] Task failed:`, err)
    throw err
  }
}

export function setupAiWorker(): Worker<AiJobData> | null {
  if (!redis) {
    console.warn('[AI Worker] Redis connection missing. Worker will not start.')
    return null
  }

  /* const worker = new Worker(
    AI_QUEUE_NAME,
    async (job: Job<AiJobData>) => {
      return await executeAiTask(job.data)
    },
    { 
      connection: redis,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000  // max 10 jobs per second
      }
    }
  )

  worker.on('completed', (job) => {
    console.log(`[AI Worker] Job ${job.id} completed successfully.`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[AI Worker] Job ${job?.id} failed with error: ${err.message}`)
  })

  return worker */
  return null
}
