import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const { data: existing } = await supabase
    .from('links')
    .select('price, title')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const oldPrice = existing?.price || null
  const newPrice = body.price !== undefined ? (body.price || null) : oldPrice
  const priceChanged = body.price !== undefined && oldPrice !== newPrice && (oldPrice || newPrice)

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updateData.title = body.title
  if (body.price !== undefined) {
    updateData.price = body.price || null
    if (priceChanged) {
      updateData.last_price = oldPrice
      updateData.price_updated_at = new Date().toISOString()
    }
  }
  if (body.category !== undefined) updateData.category = body.category
  if (body.status !== undefined) updateData.status = body.status
  if (body.memo !== undefined) updateData.memo = body.memo
  if (body.tags !== undefined) updateData.tags = body.tags
  if (body.is_favorite !== undefined) updateData.is_favorite = body.is_favorite

  const { data, error } = await supabase
    .from('links')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (priceChanged) {
    await supabase.from('price_history').insert({
      link_id: id,
      user_id: user.id,
      old_price: oldPrice,
      new_price: newPrice,
    })
  }

  return NextResponse.json({ ...data, priceChanged, oldPrice })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
