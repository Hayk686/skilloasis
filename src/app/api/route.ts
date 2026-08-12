import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', service: 'info-oasis' })
  } catch (error) {
    console.error('[api/health] database unavailable', error)
    return NextResponse.json(
      { status: 'unavailable', service: 'info-oasis' },
      { status: 503 }
    )
  }
}
