import { SupabaseClient } from '@supabase/supabase-js'
import { generateResponse } from '../gemma'
import { getUserModelConfig } from '../model-config'
import type { GeneratedTest, GeneratedTestQuestion, MilestoneTestRow, TestAttemptRow } from '@/types/skills'

export async function generateTest(
  userId: string,
  testId: string,
  supabase: SupabaseClient
): Promise<GeneratedTest> {
  const modelConfig = await getUserModelConfig(userId)
  
  // Fetch test context
  const { data: testRow, error: testError } = await supabase
    .from('milestone_tests')
    .select('*, milestone:skill_milestones(title, description, topics:skill_topics(title, type))')
    .eq('id', testId)
    .single()

  if (testError || !testRow) {
    throw new Error('Failed to fetch test context')
  }

  const milestoneContext = testRow.milestone ? 
    `Milestone: ${testRow.milestone.title}\nDescription: ${testRow.milestone.description}\nTopics Covered: ${testRow.milestone.topics.map((t: any) => t.title).join(', ')}` : 
    `General assessment for ${testRow.title}`

  const prompt = `You are an expert examiner. Generate a test based on the following context:
${milestoneContext}

The test should have 5 questions. Mix multiple_choice, short_answer, and code_snippet questions.
Provide the output strictly as a JSON object:
{
  "title": "${testRow.title}",
  "xp_on_pass": 100,
  "xp_on_fail": 20,
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question_text": "Question here",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "points": 20
    },
    {
      "id": "q2",
      "type": "short_answer",
      "question_text": "Explain X",
      "evaluation_rubric": "Give points if they mention Y and Z.",
      "points": 20
    }
  ]
}

No markdown outside JSON.`

  const rawResponse = await generateResponse(prompt, [], undefined, modelConfig.background_model, 'plan_generation')
  if (!rawResponse) throw new Error('No response from AI')

  const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
  
  try {
    const generatedTest = JSON.parse(cleanJson) as GeneratedTest
    
    // Save generated questions to DB
    await supabase.from('milestone_tests').update({
        questions: generatedTest.questions,
        xp_on_pass: generatedTest.xp_on_pass,
        xp_on_fail: generatedTest.xp_on_fail
    }).eq('id', testId)

    return generatedTest
  } catch (err) {
    console.error('[TestGenerator] JSON parse error:', err, cleanJson)
    throw new Error('Failed to parse AI test response')
  }
}
