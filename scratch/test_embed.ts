import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'

dotenv.config({ path: 'd:\\Coding\\Selfup Ai\\web\\.env.local' })

const apiKey = process.env.GOOGLE_AI_API_KEY || ''
const ai = new GoogleGenAI({ apiKey })

async function testEmbedding() {
  const text = 'test message'
  const result = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: text,
  })
  
  console.log('text-embedding-004 dims:', result.embeddings?.[0]?.values?.length)

  try {
    const result2 = await ai.models.embedContent({
      model: 'text-embedding-3-large',
      contents: text,
    })
    console.log('text-embedding-3-large dims:', result2.embeddings?.[0]?.values?.length)
  } catch(e) {
    console.log('Error with text-embedding-3-large', e)
  }

  try {
    const result3 = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
      })
      console.log('gemini-embedding-2 dims:', result3.embeddings?.[0]?.values?.length)
  } catch(e) {
      console.log('Error with gemini-embedding-2', e)
  }
}

testEmbedding()
