import { SupabaseClient } from '@supabase/supabase-js'
import { generateResponse } from '../gemma'
import { getUserModelConfig } from '../model-config'
import type { GeneratedTestQuestion } from '@/types/skills'

interface EvaluationResult {
  score_pct: number
  passed: boolean
  feedback: Record<string, {
    score: number
    max_score: number
    comment: string
    is_correct: boolean
  }>
}

export async function evaluateTest(
  userId: string,
  testId: string,
  attemptId: string,
  questions: GeneratedTestQuestion[],
  userAnswers: Record<string, string>,
  supabase: SupabaseClient
): Promise<EvaluationResult> {
  const modelConfig = await getUserModelConfig(userId)
  
  const prompt = `You are a strict but fair examiner. Evaluate the student's answers to the test.

Questions and Answers:
${questions.map(q => `
Q (${q.id}): ${q.question_text}
Type: ${q.type}
Max Points: ${q.points}
${q.correct_answer ? `Correct Answer/Key: ${q.correct_answer}` : ''}
${q.evaluation_rubric ? `Evaluation Rubric: ${q.evaluation_rubric}` : ''}
Student's Answer: ${userAnswers[q.id] || 'NO ANSWER PROVIDED'}
`).join('\n')}

Evaluate each question. If it's multiple choice and matches exactly, award full points.
If it's short_answer/code, grade it strictly based on the rubric or general correctness out of the max points.
Provide the output strictly as a JSON object:
{
  "feedback": {
    "q1": {
      "score": Number,
      "max_score": Number,
      "comment": "String explaining the grade",
      "is_correct": Boolean
    }
  }
}
No markdown outside JSON.`

  const rawResponse = await generateResponse(prompt, [], undefined, modelConfig.background_model, 'plan_generation')
  if (!rawResponse) throw new Error('No response from AI')

  const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
  
  try {
    const evaluation = JSON.parse(cleanJson)
    
    let totalScore = 0
    let totalMaxScore = 0
    
    for (const q of questions) {
      totalMaxScore += q.points
      if (evaluation.feedback[q.id]) {
        totalScore += evaluation.feedback[q.id].score
      }
    }
    
    const scorePct = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0
    
    // Fetch passing score
    const { data: test } = await supabase.from('milestone_tests').select('passing_score_pct').eq('id', testId).single()
    const passingScore = test?.passing_score_pct || 70
    
    const result: EvaluationResult = {
      score_pct: scorePct,
      passed: scorePct >= passingScore,
      feedback: evaluation.feedback
    }
    
    await supabase.from('test_attempts').update({
      score_pct: result.score_pct,
      passed: result.passed,
      feedback: result.feedback
    }).eq('id', attemptId)
    
    return result
  } catch (err) {
    console.error('[TestEvaluator] JSON parse error:', err, cleanJson)
    throw new Error('Failed to parse AI evaluation response')
  }
}
