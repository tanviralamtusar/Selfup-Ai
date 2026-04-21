import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { fetchUserMemory, saveMemory, clearUserMemory } from '@/lib/ai-memory'

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const memory = await fetchUserMemory(user.id, token!)

    return NextResponse.json(memory)
  } catch (err: any) {
    console.error('[AI Memory Get Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const { memoryKey, memoryValue, source } = await req.json()

    if (!memoryKey || !memoryValue) {
      return NextResponse.json({ error: 'memoryKey and memoryValue are required' }, { status: 400 })
    }

    await saveMemory(user.id, memoryKey, memoryValue, token!, source || 'user-input')

    return NextResponse.json({
      success: true,
      message: `Memory '${memoryKey}' saved successfully`
    })
  } catch (err: any) {
    console.error('[AI Memory Save Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const { memories } = await req.json()

    if (!Array.isArray(memories)) {
      return NextResponse.json({ error: 'memories must be an array' }, { status: 400 })
    }

    // Batch save multiple memories
    for (const mem of memories) {
      await saveMemory(user.id, mem.key, mem.value, token!, mem.source || 'batch-update')
    }

    return NextResponse.json({
      success: true,
      message: `${memories.length} memories saved successfully`
    })
  } catch (err: any) {
    console.error('[AI Memory Batch Save Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    // Add confirmation header to prevent accidental deletion
    const confirm = req.headers.get('x-confirm-memory-clear')
    if (confirm !== 'true') {
      return NextResponse.json(
        { error: 'Confirmation required. Set header x-confirm-memory-clear: true' },
        { status: 400 }
      )
    }

    await clearUserMemory(user.id, token!)

    return NextResponse.json({
      success: true,
      message: 'All user memory cleared'
    })
  } catch (err: any) {
    console.error('[AI Memory Clear Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
