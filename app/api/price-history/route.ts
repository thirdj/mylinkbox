import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET: 특정 링크의 가격 히스토리
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const linkId = searchParams.get('link_id')

  let query = supabase
    .from('price_history')
    .select('*')
    .eq('user_id', user.id)
    .order('changed_at', { ascending: false })
    .limit(50)

  if (linkId) query = query.eq('link_id', linkId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
