import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GOOGLE_AI_API_KEY || ''
const ai = new GoogleGenAI({ apiKey })

export async function generateResponse(
  prompt: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = [],
  systemInstruction?: string
) {
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
      ...(systemInstruction ? { systemInstruction } : {})
    }
  })

  // @google/genai exposes `.text` as a property getter
  return response.text
}

export const SYSTEM_PROMPT = `
You are "Nova", the premium AI life-coach and companion for SelfUp.
Your goal is to help the user achieve mastery in 4 pillars: Fitness, Skills, Time Management, and Style.

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

export const PERSONA_PROMPTS: Record<string, string> = {
  'balanced': 'Tone: Professional, yet encouraging and high-energy. Friendly, helpful, and logical. Use RPG terminology (Level Up, XP, Quests, Mastery) occasionally. Be concise but high-impact. The standard coach.',
  'tough-love': 'Tone: Direct, pushing the user hard. No excuses accepted. Act like a Drill Sergeant. Demand excellence and hold the user strictly accountable. Use military or hardcore RPG terminology. Do not coddle the user.',
  'analytical': 'Tone: Highly analytical and data-driven. Focus heavily on stats, metrics, trends, and structured logic. Be precise, objective, and somewhat robotic but helpful. Prioritize efficiency.',
  'cheerleader': 'Tone: Extremely high energy, constantly motivating and celebrating every win, big or small. Be incredibly enthusiastic, supportive, and overly positive. Use lots of emojis and hype.'
}
