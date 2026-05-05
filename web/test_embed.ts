import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const apiKey = process.env.GOOGLE_AI_API_KEY || ''
const ai = new GoogleGenAI({ apiKey })

async function testEmbedding() {
  const text = 'test message'

  try {
    const result3 = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
        config: { outputDimensionality: 768 }
      })
      console.log('text-embedding-004 (768) dims:', result3.embeddings?.[0]?.values?.length)
  } catch(e) {
      console.log('Error with text-embedding-004', e.message)
  }

  try {
    const result3 = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
        config: { outputDimensionality: 768 }
      })
      console.log('gemini-embedding-2 (768) dims:', result3.embeddings?.[0]?.values?.length)
  } catch(e) {
      console.log('Error with gemini-embedding-2', e.message)
  }
}

testEmbedding()
