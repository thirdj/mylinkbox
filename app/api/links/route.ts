import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const filter = searchParams.get('filter') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '30')
  const offset = (page - 1) * limit

  // 데이터 쿼리와 카운트 쿼리 병렬 실행
  let dataQuery = supabase
    .from('links')
    .select('id,url,title,thumbnail,favicon,site_name,price,last_price,price_updated_at,category,is_favorite,memo,created_at,updated_at')
    .eq('user_id', user.id)

  let countQuery = supabase
    .from('links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (filter === 'favorite') {
    dataQuery = dataQuery.eq('is_favorite', true)
    countQuery = countQuery.eq('is_favorite', true)
  } else if (filter === 'no_price') {
    dataQuery = dataQuery.is('price', null)
    countQuery = countQuery.is('price', null)
  }

  if (category && category !== '전체') {
    dataQuery = dataQuery.eq('category', category)
    countQuery = countQuery.eq('category', category)
  }

  dataQuery = dataQuery
    .order('is_favorite', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // 병렬 실행으로 속도 향상
  const [{ data, error }, { count }] = await Promise.all([
    dataQuery,
    countQuery,
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total = count || 0
  const res = NextResponse.json({
    items: data || [],
    total,
    page,
    hasMore: (offset + limit) < total,
  })

  // 브라우저 캐시 방지 (항상 최신 데이터)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data: existing } = await supabase
    .from('links')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('url', body.url)
    .single()

  if (existing) return NextResponse.json({ error: 'DUPLICATE', existing }, { status: 409 })

  const { data, error } = await supabase
    .from('links')
    .insert({
      user_id: user.id,
      url: body.url,
      title: body.title,
      description: body.description,
      thumbnail: body.thumbnail,
      site_name: body.site_name,
      favicon: body.favicon,
      price: body.price || null,
      category: body.category || '기타',
      is_favorite: false,
      memo: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
