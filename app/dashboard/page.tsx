'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { LinkItem, ViewMode, SortMode, FilterMode, Category } from '@/types'
import AddLinkBar from '@/components/AddLinkBar'
import LinkCard from '@/components/LinkCard'
import Toolbar from '@/components/Toolbar'
import EditModal from '@/components/EditModal'
import PriceHistoryModal from '@/components/PriceHistoryModal'
import SearchBar from '@/components/SearchBar'
import ImportExportModal from '@/components/ImportExportModal'
import PriceAlertBell from '@/components/PriceAlertBell'
import { Plus, X, MoreVertical, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

function parsePrice(p: string | null): number {
  if (!p) return 0
  return parseInt(p.replace(/[^0-9]/g, '')) || 0
}

const PAGE_SIZE = 30

// 카드 스켈레톤
function CardSkeleton({ view }: { view: ViewMode }) {
  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-3 animate-pulse">
        <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded-full w-3/4" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
        <div className="h-3.5 bg-gray-200 rounded-full w-full" />
        <div className="h-3.5 bg-gray-200 rounded-full w-4/5" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const [items, setItems] = useState<LinkItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [view, setView] = useState<ViewMode>('grid2')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [sort, setSort] = useState<SortMode>('newest')
  const [categoryFilter, setCategoryFilter] = useState('전체')
  const [categories, setCategories] = useState<Category[]>([])
  const [editItem, setEditItem] = useState<LinkItem | null>(null)
  const [priceHistoryItem, setPriceHistoryItem] = useState<{ id: string; title: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showImportExport, setShowImportExport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const fetchPage = useCallback(async (p: number, f: FilterMode, cat: string) => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(p),
      limit: String(PAGE_SIZE),
      filter: f,
    })
    if (cat !== '전체') params.set('category', cat)

    const res = await fetch(`/api/links?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(Math.max(1, Math.ceil(data.total / PAGE_SIZE)))
      setPage(p)
    }
    setLoading(false)
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
      // getSession() 은 캐시에서 바로 반환 → 빠름
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth'; return }
      setAuthChecked(true)

      // 링크와 카테고리를 병렬로 fetch
      await Promise.all([
        fetchPage(1, 'all', '전체'),
        fetchCategories(),
      ])
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = useCallback((f: FilterMode) => {
    setFilter(f)
    fetchPage(1, f, categoryFilter)
  }, [categoryFilter, fetchPage])

  const handleCategoryChange = useCallback((cat: string) => {
    setCategoryFilter(cat)
    fetchPage(1, filter, cat)
  }, [filter, fetchPage])

  const handlePageChange = (p: number) => {
    fetchPage(p, filter, categoryFilter)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAdd = async (linkData: Omit<LinkItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkData),
    })
    if (res.status === 409) return { duplicate: true }
    if (res.ok) fetchPage(1, filter, categoryFilter)
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
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
    if (res.ok) {
      const targetPage = items.length === 1 && page > 1 ? page - 1 : page
      fetchPage(targetPage, filter, categoryFilter)
    }
  }

  const handleToggleFavorite = (id: string, val: boolean) => handleEdit(id, { is_favorite: val })

  const handleAddCategory = async () => {
    const name = prompt('새 카테고리 이름:')
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
    if (!confirm(`"${cat.name}" 삭제?`)) return
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      if (categoryFilter === cat.name) handleCategoryChange('전체')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const categoryNames = categories.map(c => c.name)

  const displayed = useMemo(() => {
    let list = [...items]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.site_name || '').toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'price_asc') return parsePrice(a.price) - parsePrice(b.price)
      if (sort === 'price_desc') return parsePrice(b.price) - parsePrice(a.price)
      if (sort === 'site') return (a.site_name || '').localeCompare(b.site_name || '')
      return 0
    })
    return list
  }, [items, search, sort])

  const totalBudget = useMemo(() => {
    const priced = items.filter(i => i.price)
    if (priced.length === 0) return null
    const sum = priced.reduce((s, i) => s + parsePrice(i.price), 0)
    return '₩' + sum.toLocaleString('ko-KR')
  }, [items])

  const gridClass =
    view === 'grid2' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' :
    view === 'grid3' ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2' :
    'flex flex-col gap-2'

  const skeletonCount = view === 'list' ? 6 : view === 'grid3' ? 9 : 6

  const pageNumbers = useMemo(() => {
    const delta = 2
    const range: number[] = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i)
    }
    return range
  }, [page, totalPages])

  // auth 확인 전에는 빈 화면
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <span className="font-black text-gray-900 tracking-tight text-lg">Damoajo</span>
          </div>
          <div className="flex items-center gap-1">
            <PriceAlertBell />
            {/* + 버튼 헤더에 */}
            <button
              onClick={() => setShowAddLink(true)}
              className="flex items-center gap-1 px-3 h-8 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">추가</span>
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu(v => !v)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-2xl shadow-xl w-44 py-1.5 z-50">
                    <button onClick={() => { setShowImportExport(true); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      📤 내보내기 / 가져오기
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                      <LogOut size={14} /> 로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4">
        <SearchBar value={search} onChange={setSearch} />

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
          {['전체', ...categoryNames].map(cat => (
            <div key={cat} className="relative group flex-shrink-0">
              <button onClick={() => handleCategoryChange(cat)}
                className={`text-xs h-7 px-3 rounded-full border transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-200'
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
            className="flex-shrink-0 text-xs h-7 px-3 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 whitespace-nowrap flex items-center gap-1">
            <Plus size={10} /> 추가
          </button>
        </div>

        <Toolbar
          view={view} filter={filter} sort={sort}
          onViewChange={setView} onFilterChange={handleFilterChange} onSortChange={setSort}
          totalCount={total} totalBudget={totalBudget}
        />

        {/* 스켈레톤 or 콘텐츠 */}
        {loading ? (
          <div className={gridClass}>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <CardSkeleton key={i} view={view} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📦</span>
            <p className="text-sm font-medium">{search ? '검색 결과가 없습니다.' : '저장된 링크가 없습니다.'}</p>
            <p className="text-xs mt-1">{search ? '다른 키워드로 검색해보세요.' : '+ 버튼으로 저장해보세요.'}</p>
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {displayed.map(item => (
                <LinkCard
                  key={item.id}
                  item={item}
                  view={view}
                  onEdit={setEditItem}
                  onDelete={handleDelete}
                  onPriceHistory={() => setPriceHistoryItem({ id: item.id, title: item.title })}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8 mb-2">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers[0] > 1 && (
                  <>
                    <button onClick={() => handlePageChange(1)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-gray-300">1</button>
                    {pageNumbers[0] > 2 && <span className="text-gray-400 text-sm px-1">···</span>}
                  </>
                )}

                {pageNumbers.map(p => (
                  <button key={p} onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                      p === page ? 'bg-blue-600 text-white border border-blue-600 shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}>
                    {p}
                  </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                      <span className="text-gray-400 text-sm px-1">···</span>
                    )}
                    <button onClick={() => handlePageChange(totalPages)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-gray-300">
                      {totalPages}
                    </button>
                  </>
                )}

                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <p className="text-center text-xs text-gray-400 mb-4">
                {page} / {totalPages} 페이지 · 총 {total}개
              </p>
            )}
          </>
        )}
      </main>

      {showAddLink && (
        <AddLinkBar
          categories={categoryNames}
          onAdd={handleAdd}
          defaultOpen={true}
          onClose={() => setShowAddLink(false)}
        />
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
          onImportDone={() => fetchPage(1, filter, categoryFilter)}
        />
      )}
    </div>
  )
}