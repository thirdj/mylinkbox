'use client'
import Image from 'next/image'
import { Pencil, Trash2, Star } from 'lucide-react'
import { LinkItem } from '@/types'
import { getSiteLabel } from '@/lib/utils'

interface Props {
  item: LinkItem
  view: 'grid2' | 'grid3' | 'list'
  onEdit: (item: LinkItem) => void
  onDelete: (id: string) => void
  onPriceHistory: () => void
  onToggleFavorite: (id: string, val: boolean) => void
}

function formatPrice(p: string | null) {
  if (!p) return null
  const num = parseInt(p.replace(/[^0-9]/g, ''))
  if (isNaN(num)) return p
  return '₩' + num.toLocaleString('ko-KR')
}

export default function LinkCard({ item, view, onEdit, onDelete, onPriceHistory, onToggleFavorite }: Props) {
  const displayPrice = formatPrice(item.price)
  const hasPriceChange = item.last_price && item.last_price !== item.price

  // ── 리스트 뷰 ──
  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-gray-200 transition-colors">
        {/* 썸네일 */}
        <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {item.thumbnail
            ? <Image src={item.thumbnail} alt="" width={48} height={48} className="object-cover w-full h-full" unoptimized loading="lazy" />
            : item.favicon
              ? <Image src={item.favicon} alt="" width={24} height={24} unoptimized />
              : <span className="text-xl">🔗</span>}
        </div>

        {/* 제목 + 사이트 + 금액 */}
        <div className="flex-1 min-w-0">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.35',
            }}
          >
            {item.title}
          </a>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 truncate max-w-[100px]">
              {item.site_name || getSiteLabel(item.url)}
            </span>
            {displayPrice && (
              <button onClick={onPriceHistory} className="text-xs font-bold text-blue-600 hover:underline flex-shrink-0">
                {displayPrice}
                {hasPriceChange && <span className="ml-0.5 text-[10px] text-green-500">↓</span>}
              </button>
            )}
          </div>
        </div>

        {/* 버튼 3개 — 오른쪽 끝 고정 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => onToggleFavorite(item.id, !item.is_favorite)}
            className={`p-1.5 rounded-lg transition-colors ${item.is_favorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
          >
            <Star size={14} fill={item.is_favorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )
  }

  // ── 그리드 뷰 ──
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group flex flex-col relative">
      {/* 즐겨찾기 - 오른쪽 상단 */}
      <button
        onClick={() => onToggleFavorite(item.id, !item.is_favorite)}
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-sm shadow-sm transition-all ${
          item.is_favorite
            ? 'bg-yellow-400 text-white'
            : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Star size={11} fill={item.is_favorite ? 'currentColor' : 'none'} />
      </button>

      {/* 썸네일 */}
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block flex-shrink-0">
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-100">
              {item.favicon ? (
                <>
                  <Image src={item.favicon} alt="" width={36} height={36} unoptimized className="rounded-lg shadow-sm" />
                  <span className="text-xs text-gray-500 font-medium px-2 text-center line-clamp-2 max-w-full">
                    {item.site_name || getSiteLabel(item.url)}
                  </span>
                </>
              ) : (
                <span className="text-4xl">🔗</span>
              )}
            </div>
          )}
        </div>
      </a>

      <div className="p-3 flex flex-col flex-1">
        {/* 사이트명 */}
        <div className="flex items-center gap-1 mb-1">
          {item.favicon && <Image src={item.favicon} alt="" width={11} height={11} unoptimized className="rounded-sm opacity-60" />}
          <span className="text-[10px] text-gray-400 truncate">{item.site_name || getSiteLabel(item.url)}</span>
        </div>

        {/* 제목 - 2줄 고정 말줄임 */}
        <div className="mb-2" style={{ minHeight: '2.6rem' }}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.3rem',
            }}
          >
            {item.title}
          </a>
        </div>

        {/* 가격 */}
        {displayPrice ? (
          <button onClick={onPriceHistory} className="text-left mb-2">
            <span className="text-sm font-bold text-blue-600">{displayPrice}</span>
            {hasPriceChange && (
              <span className="ml-1.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">↓변동</span>
            )}
          </button>
        ) : null}

        {/* 하단 액션 */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full truncate max-w-[60%]">{item.category}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(item)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
              <Pencil size={12} />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}