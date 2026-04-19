import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  // Example of using auth middleware
  // const { user, error } = await verifyAuth(req)
  // if (error) return NextResponse.json({ error }, { status: 401 })

  return NextResponse.json({ message: 'style route works!' })
}
