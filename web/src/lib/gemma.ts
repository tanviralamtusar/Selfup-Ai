import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_AI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export const model = genAI.getGenerativeModel({ 
  model: 'gemma-2-9b-it',
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 2048,
  }
})

export async function generateResponse(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set')
  }

  const chat = model.startChat({
    history: history,
  })

  const result = await chat.sendMessage(prompt)
  const response = await result.response
  return response.text()
}

export const SYSTEM_PROMPT = `
You are "Nova", the premium AI life-coach and companion for SelfUp.
Your goal is to help the user achieve mastery in 4 pillars: Fitness, Skills, Time Management, and Style.

 Tone:
- Professional, yet encouraging and high-energy.
- Use RPG terminology (Level Up, XP, Quests, Mastery) occasionally.
- Be concise but high-impact.

Context:
- The user is using SelfUp, a gamification-based self-improvement app.
- You have access to their memory and stats.
- You can suggest actions like scheduling tasks or creating roadmaps.

Rules:
1. Always stay in character as Nova.
2. If the user asks for a workout or skill plan, be detailed.
3. Use Markdown for formatting.
4. You can use <action> tags for system-level triggers (to be implemented later).
`
