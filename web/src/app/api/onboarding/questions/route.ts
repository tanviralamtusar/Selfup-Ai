import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { generateResponse, SYSTEM_PROMPT } from '@/lib/gemma'

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { goals } = await req.json()
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: 'Goals are required' }, { status: 400 })
    }

    const prompt = `
      The user has selected the following goals for their self-improvement journey:
      ${goals.join(', ')}

      As System, their AI life-coach, generate 3 essential and concise follow-up questions to understand their current status, previous experience, and any immediate obstacles related to these goals.
      
      Requirements:
      1. Be encouraging and concise.
      2. Ask one question at a time (total 3).
      3. Return the response ONLY as a JSON array of objects.
      
      Format:
      [
        { "id": "exp", "text": "What is your current experience level with [Goal]?" },
        { "id": "time", "text": "How many hours per week can you realistically dedicate to these goals?" },
        { "id": "obstacle", "text": "What is the biggest challenge you face in staying consistent?" }
      ]
    `

    const responseText = await generateResponse(prompt, [], SYSTEM_PROMPT)
    
    // Attempt to parse JSON from response
    try {
      const jsonStart = responseText.indexOf('[')
      const jsonEnd = responseText.lastIndexOf(']') + 1
      const jsonString = responseText.substring(jsonStart, jsonEnd)
      const questions = JSON.parse(jsonString)
      
      return NextResponse.json({ questions })
    } catch (parseError) {
      console.error('[AI Parse Error]:', responseText)
      // Fallback questions if AI fails to return valid JSON
      return NextResponse.json({ 
        questions: [
          { id: 'experience', text: 'What is your current experience level with these goals?' },
          { id: 'commitment', text: 'How many hours per week can you realistically dedicate to your growth?' },
          { id: 'motivation', text: 'What motivated you to start this journey today?' }
        ]
      })
    }
  } catch (err: any) {
    console.error('[Questions API Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
