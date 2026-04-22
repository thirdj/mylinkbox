import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const links = body.links || []
    const categories = body.categories || []

    // 카테고리 가져오기 (중복 제외)
    let importedCats = 0
    for (const cat of categories) {
      const { error } = await supabase
        .from('categories')
        .insert({ user_id: user.id, name: cat.name, color: cat.color || '#3b82f6' })
      if (!error) importedCats++
    }

    // 링크 가져오기 (중복 URL 제외)
    let importedLinks = 0
    let skipped = 0
    for (const link of links) {
      const { error } = await supabase
        .from('links')
        .insert({
          user_id: user.id,
          url: link.url,
          title: link.title,
          description: link.description,
          thumbnail: link.thumbnail,
          site_name: link.site_name,
          favicon: link.favicon,
          price: link.price,
          category: link.category || '기타',
          tags: link.tags || [],
          is_favorite: link.is_favorite || false,
          status: link.status || 'wish',
          memo: link.memo,
        })
      if (error?.code === '23505') skipped++ // unique violation
      else if (!error) importedLinks++
    }

    return NextResponse.json({ importedLinks, importedCats, skipped })
  } catch {
    return NextResponse.json({ error: '파일 형식이 올바르지 않습니다.' }, { status: 400 })
  }
}
