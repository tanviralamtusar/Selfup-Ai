import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GOOGLE_AI_API_KEY || ''
const ai = new GoogleGenAI({ apiKey })

export async function generateResponse(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set')
  }

  const contents = [
    ...history,
    {
      role: 'user',
      parts: [
        {
          text: prompt,
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model: 'gemma-4-31b-it',
    contents,
    config: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  })

  // @google/genai exposes `.text` as a property getter
  return response.text
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
