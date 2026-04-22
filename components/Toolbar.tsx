'use client'
import { LayoutGrid, List, Grid3X3, ArrowUpDown, Star } from 'lucide-react'
import { ViewMode, SortMode } from '@/types'

interface Props {
  view: ViewMode
  filter: string
  sort: SortMode
  onViewChange: (v: ViewMode) => void
  onFilterChange: (f: string) => void
  onSortChange: (s: SortMode) => void
  totalCounts: { all: number; wish: number; bought: number; archived: number }
  totalBudget: string | null
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
  { value: 'site', label: '사이트별' },
]

export default function Toolbar({ view, filter, sort, onViewChange, onFilterChange, onSortChange, totalCounts, totalBudget }: Props) {
  const filters = [
    { key: 'all', label: `전체 ${totalCounts.all}` },
    { key: 'wish', label: `위시 ${totalCounts.wish}` },
    { key: 'bought', label: `완료 ${totalCounts.bought}` },
    { key: 'archived', label: `보관 ${totalCounts.archived}` },
    { key: 'favorite', label: '⭐' },
  ]

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between gap-2">
        {/* 상태 필터 - 모바일 스크롤 가능 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto flex-shrink min-w-0">
          {filters.map(f => (
            <button key={f.key} onClick={() => onFilterChange(f.key)}
              className={`text-xs h-7 px-2.5 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                filter === f.key ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-500'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* 뷰 전환 */}
        <div className="flex items-center gap-0.5 border border-gray-200 rounded-xl p-1 bg-white flex-shrink-0">
          {[
            { key: 'grid2' as ViewMode, Icon: LayoutGrid },
            { key: 'grid3' as ViewMode, Icon: Grid3X3 },
            { key: 'list' as ViewMode, Icon: List },
          ].map(({ key, Icon }) => (
            <button key={key} onClick={() => onViewChange(key)}
              className={`p-1.5 rounded-lg transition-all ${view === key ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* 정렬 + 예산 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={11} className="text-gray-400" />
          <select value={sort} onChange={e => onSortChange(e.target.value as SortMode)}
            className="text-xs text-gray-600 bg-transparent border-none outline-none cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {totalBudget && (
          <div className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
            위시 총액 <span className="font-bold text-blue-600">{totalBudget}</span>
          </div>
        )}
      </div>
    </div>
  )
}
