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
import ImportExportModal from '@/components/ImportExportModal'
import { LogOut, Plus, X, MoreVertical, Star } from 'lucide-react'

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
  const [showImportExport, setShowImportExport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [tagFilter, setTagFilter] = useState('')
  const [showAddLink, setShowAddLink] = useState(false)

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
      if (updated.priceChanged) alert(`💰 가격 변동!\n${updated.oldPrice} → ${updates.price}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleToggleFavorite = async (id: string, val: boolean) => {
    await handleEdit(id, { is_favorite: val })
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

  // 전체 태그 목록
  const allTags = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => i.tags?.forEach(t => set.add(t)))
    return Array.from(set)
  }, [items])

  const filtered = useMemo(() => {
    let list = [...items]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.site_name || '').toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    if (filter === 'favorite') list = list.filter(i => i.is_favorite)
    else if (filter !== 'all') list = list.filter(i => i.status === filter)
    if (categoryFilter !== '전체') list = list.filter(i => i.category === categoryFilter)
    if (tagFilter) list = list.filter(i => i.tags?.includes(tagFilter))
    list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'price_asc') return parsePrice(a.price) - parsePrice(b.price)
      if (sort === 'price_desc') return parsePrice(b.price) - parsePrice(a.price)
      if (sort === 'site') return (a.site_name || '').localeCompare(b.site_name || '')
      return 0
    })
    return list
  }, [items, search, filter, categoryFilter, sort, tagFilter])

  const counts = {
    all: items.length,
    wish: items.filter(i => i.status === 'wish').length,
    bought: items.filter(i => i.status === 'bought').length,
    archived: items.filter(i => i.status === 'archived').length,
  }

  // 위시 예산 합산 (원화)
  const totalBudget = useMemo(() => {
    const wishItems = items.filter(i => i.status === 'wish' && i.price)
    if (wishItems.length === 0) return null
    const total = wishItems.reduce((sum, i) => sum + parsePrice(i.price), 0)
    return '₩' + total.toLocaleString('ko-KR')
  }, [items])

  const gridClass =
    view === 'grid2' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' :
    view === 'grid3' ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2' :
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <span className="font-bold text-gray-900 tracking-tight text-lg">Damoajo</span>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton filter={filter} category={categoryFilter} />
            {/* 더보기 메뉴 */}
            <div className="relative">
              <button onClick={() => setShowMenu(v => !v)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-2xl shadow-xl w-44 py-1.5 z-50">
                  <button onClick={() => { setShowImportExport(true); setShowMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    📤 내보내기 / 가져오기
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <div className="px-4 py-2 text-xs text-gray-400 truncate">{userEmail}</div>
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                    <LogOut size={14} /> 로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* 검색 */}
        <SearchBar value={search} onChange={setSearch} />

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {['전체', ...categoryNames].map(cat => (
            <div key={cat} className="relative group">
              <button onClick={() => setCategoryFilter(cat)}
                className={`text-xs h-7 px-3 rounded-full border transition-all ${
                  categoryFilter === cat
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                {cat}
              </button>
              {cat !== '전체' && (
                <button
                  onClick={e => { e.stopPropagation(); const c = categories.find(x => x.name === cat); if (c) handleDeleteCategory(c) }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 hover:bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex text-[10px]">
                  <X size={8} />
                </button>
              )}
            </div>
          ))}
          <button onClick={handleAddCategory}
            className="text-xs h-7 px-3 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 flex items-center gap-1">
            <Plus size={10} /> 추가
          </button>
        </div>

        {/* 태그 필터 */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className="text-xs text-gray-400">태그:</span>
            {allTags.map(t => (
              <button key={t} onClick={() => setTagFilter(tagFilter === t ? '' : t)}
                className={`text-xs h-6 px-2.5 rounded-full border transition-all ${
                  tagFilter === t
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-purple-600 border-purple-200 hover:border-purple-400'
                }`}>
                #{t}
              </button>
            ))}
          </div>
        )}

        <Toolbar
          view={view} filter={filter} sort={sort}
          onViewChange={setView} onFilterChange={setFilter} onSortChange={setSort}
          totalCounts={counts} totalBudget={totalBudget}
        />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📦</span>
            <p className="text-sm font-medium">{search ? '검색 결과가 없습니다.' : '저장된 링크가 없습니다.'}</p>
            <p className="text-xs mt-1">{search ? '다른 키워드로 검색해보세요.' : '+ 버튼으로 링크를 저장해보세요.'}</p>
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
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      {/* 오른쪽 하단 + 버튼 */}
      <button
        onClick={() => setShowAddLink(true)}
        className="fixed bottom-6 right-5 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center text-2xl font-light transition-all hover:scale-105 active:scale-95 z-40"
      >
        +
      </button>

      {/* AddLink 모달 */}
      {showAddLink && (
        <div className="fixed inset-0 z-50">
          <AddLinkBar
            categories={categoryNames}
            onAdd={handleAdd}
            defaultOpen={true}
            onClose={() => setShowAddLink(false)}
          />
        </div>
      )}

      <EditModal
        item={editItem}
        categories={['기타', ...categoryNames]}
        onSave={handleEdit}
        onClose={() => setEditItem(null)}
        onPriceHistory={editItem ? () => { setEditItem(null); setPriceHistoryItem({ id: editItem.id, title: editItem.title }) } : undefined}
      />

      <PriceHistoryModal
        linkId={priceHistoryItem?.id ?? null}
        linkTitle={priceHistoryItem?.title ?? ''}
        onClose={() => setPriceHistoryItem(null)}
      />

      {showImportExport && (
        <ImportExportModal
          onClose={() => setShowImportExport(false)}
          onImportDone={fetchLinks}
        />
      )}

      {/* 메뉴 외부 클릭 닫기 */}
      {showMenu && <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />}
    </div>
  )
}