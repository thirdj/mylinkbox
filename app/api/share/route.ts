import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filter, category } = await req.json()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // 공유 링크: 쿼리파라미터로 필터 전달
  const params = new URLSearchParams()
  params.set('shared', user.id.slice(0, 8)) // 익명 ID
  if (filter && filter !== 'all') params.set('filter', filter)
  if (category && category !== '전체') params.set('category', category)

  const shareUrl = `${siteUrl}/shared?${params.toString()}`
  return NextResponse.json({ url: shareUrl })
}
