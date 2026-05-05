import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { executeConfirmedAction } from '@/lib/ai-actions'

/**
 * POST /api/ai/chat/confirm
 * Executes a confirmed action from the chat widget.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    if (!action || !action.type) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 })
    }

    const result = await executeConfirmedAction(user.id, action)

    return NextResponse.json({
      success: result.success,
      data: { message: result.message },
      ...(result.success ? {} : { error: result.message }),
    })
  } catch (err: any) {
    console.error('[AI Action Confirm Error]:', err)
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
