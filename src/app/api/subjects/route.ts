import { NextResponse } from 'next/server'
import { SUBJECTS } from '@/lib/subjects'

export const dynamic = 'force-static'

export async function GET() {
  return NextResponse.json({ subjects: SUBJECTS })
}
