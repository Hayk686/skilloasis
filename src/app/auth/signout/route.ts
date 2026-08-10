import { NextResponse } from 'next/server'
import { clearUserIdCookie } from '@/lib/gamify'
import { getSupabasePublicConfig } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  if (getSupabasePublicConfig()) {
    const supabase = await createClient()
    await supabase.auth.signOut({ scope: 'local' })
  }

  const response = NextResponse.json({ ok: true })
  clearUserIdCookie(response)
  return response
}
