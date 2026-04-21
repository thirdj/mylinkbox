'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { LinkItem, ViewMode, SortMode, Category } from '@/types'
import AddLinkBar from '@/components/AddLinkBar'
import LinkCard from '@/components/LinkCard'
import Toolbar from '@/components/Toolbar'
import EditModal from '@/components/EditModal'
import PriceHistoryModal from '@/components/PriceHistoryModal'
import SearchBar from '@/components/SearchBar'
import ShareButton from '@/components/ShareButton'
import { Package, LogOut, Plus, X } from 'lucide-react'

function parsePrice(p: string | null): number {
  if (!p) return 0
  return parseInt(p.replace(/[^0-9]/g, '')) || 0
}

export default function DashboardPage() {
  const supabase = createClient()
  const [items, setItems] = useState<LinkItem[]>([])
  const [view, setView] = useState<ViewMode>('grid2')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<SortMode>('newest')
  const [categoryFilter, setCategoryFilter] = useState('전체')
  const [categories, setCategories] = useState<Category[]>([])
  const [editItem, setEditItem] = useState<LinkItem | null>(null)
  const [priceHistoryItem, setPriceHistoryItem] = useState<{ id: string; title: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [search, setSearch] = useState('')

  const fetchLinks = useCallback(async () => {
    const res = await fetch('/api/links')
    if (res.ok) setItems(await res.json())
  }, [])

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/categories')
    if (res.ok) {
      const data = await res.json()
      if (data.length > 0) setCategories(data)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }
      setUserEmail(user.email || '')
      await Promise.all([fetchLinks(), fetchCategories()])
      setLoading(false)
    }
    init()
  }, [supabase, fetchLinks, fetchCategories])

  const handleAdd = async (linkData: Omit<LinkItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkData),
    })
    if (res.status === 409) return { duplicate: true }
    if (res.ok) {
      const newItem = await res.json()
      setItems(prev => [newItem, ...prev])
    }
    return {}
  }

  const handleEdit = async (id: string, updates: Partial<LinkItem>) => {
    const res = await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      if (updated.priceChanged) {
        const msg = `💰 가격 변동!\n${updated.oldPrice || '미입력'} → ${updates.price || '미입력'}`
        alert(msg)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleStatusChange = async (id: string, status: LinkItem['status']) => {
    await handleEdit(id, { status })
  }

  const handleAddCategory = async () => {
    const name = prompt('새 카테고리 이름을 입력하세요:')
    if (!name || categories.find(c => c.name === name)) return
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const newCat = await res.json()
      setCategories(prev => [...prev, newCat])
    }
  }

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`"${cat.name}" 카테고리를 삭제할까요?`)) return
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      if (categoryFilter === cat.name) setCategoryFilter('전체')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const categoryNames = categories.map(c => c.name)

  const filtered = useMemo(() => {
    let list = [...items]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.site_name || '').toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      )
    }
    if (filter !== 'all') list = list.filter(i => i.status === filter)
    if (categoryFilter !== '전체') list = list.filter(i => i.category === categoryFilter)
    list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'price_asc') return parsePrice(a.price) - parsePrice(b.price)
      if (sort === 'price_desc') return parsePrice(b.price) - parsePrice(a.price)
      if (sort === 'site') return (a.site_name || '').localeCompare(b.site_name || '')
      return 0
    })
    return list
  }, [items, search, filter, categoryFilter, sort])

  const counts = {
    all: items.length,
    wish: items.filter(i => i.status === 'wish').length,
    bought: items.filter(i => i.status === 'bought').length,
    archived: items.filter(i => i.status === 'archived').length,
  }

  const totalBudget = useMemo(() => {
    const wishItems = items.filter(i => i.status === 'wish' && i.price)
    if (wishItems.length === 0) return null
    const total = wishItems.reduce((sum, i) => sum + parsePrice(i.price), 0)
    return total.toLocaleString() + '원'
  }, [items])

  const gridClass =
    view === 'grid2' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' :
    view === 'grid3' ? 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5' :
    'flex flex-col gap-2'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-blue-600" />
            <span className="font-semibold text-gray-900">MyLinkBox</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 6번: 공유 버튼 */}
            <ShareButton filter={filter} category={categoryFilter} />
            <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100">
              <LogOut size={13} /> 로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <AddLinkBar categories={categoryNames} onAdd={handleAdd} />
        <SearchBar value={search} onChange={setSearch} />

        {/* 카테고리 필터 + 삭제 */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {['전체', ...categoryNames].map(cat => (
            <div key={cat} className="relative group">
              <button
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs h-7 px-3 rounded-full border transition-all ${
                  categoryFilter === cat
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
              {cat !== '전체' && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    const catObj = categories.find(c => c.name === cat)
                    if (catObj) handleDeleteCategory(catObj)
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 hover:bg-red-500 text-white rounded-full items-center justify-center text-[10px] hidden group-hover:flex transition-colors"
                >
                  <X size={8} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddCategory}
            className="text-xs h-7 px-3 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <Plus size={11} /> 추가
          </button>
        </div>

        <Toolbar
          view={view}
          filter={filter}
          sort={sort}
          onViewChange={setView}
          onFilterChange={setFilter}
          onSortChange={setSort}
          totalCounts={counts}
          totalBudget={totalBudget}
        />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={40} className="mb-3 text-gray-200" />
            <p className="text-sm">{search ? '검색 결과가 없습니다.' : '저장된 링크가 없습니다.'}</p>
            <p className="text-xs mt-1">{search ? '다른 키워드로 검색해보세요.' : '위에서 링크를 붙여넣어 저장해보세요.'}</p>
          </div>
        ) : (
          <div className={gridClass}>
            {filtered.map(item => (
              <LinkCard
                key={item.id}
                item={item}
                view={view}
                onEdit={setEditItem}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onPriceHistory={() => setPriceHistoryItem({ id: item.id, title: item.title })}
              />
            ))}
          </div>
        )}
      </main>

      <EditModal
        item={editItem}
        categories={['기타', ...categoryNames]}
        onSave={handleEdit}
        onClose={() => setEditItem(null)}
        onPriceHistory={editItem ? () => {
          setEditItem(null)
          setPriceHistoryItem({ id: editItem.id, title: editItem.title })
        } : undefined}
      />

      <PriceHistoryModal
        linkId={priceHistoryItem?.id ?? null}
        linkTitle={priceHistoryItem?.title ?? ''}
        onClose={() => setPriceHistoryItem(null)}
      />
    </div>
  )
}
