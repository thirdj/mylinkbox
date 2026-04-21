import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('shared')
  const filter = searchParams.get('filter')
  const category = searchParams.get('category')

  if (!userId) return NextResponse.json({ error: '잘못된 공유 링크입니다.' }, { status: 400 })

  // shared= 파라미터는 user_id 앞 8자리 — 전체 user 목록에서 매칭
  const { data: users } = await supabase
    .from('links')
    .select('user_id')
    .ilike('user_id', `${userId}%`)
    .limit(1)

  const fullUserId = users?.[0]?.user_id
  if (!fullUserId) return NextResponse.json({ error: '공유 링크를 찾을 수 없습니다.' }, { status: 404 })

  let query = supabase
    .from('links')
    .select('*')
    .eq('user_id', fullUserId)
    .order('created_at', { ascending: false })

  if (filter && filter !== 'all') query = query.eq('status', filter)
  if (category && category !== '전체') query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
