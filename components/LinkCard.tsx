'use client'
import Image from 'next/image'
import { Pencil, Trash2, ShoppingBag, Heart, Archive, TrendingDown, Star, Tag } from 'lucide-react'
import { LinkItem } from '@/types'
import { getSiteLabel } from '@/lib/utils'

interface Props {
  item: LinkItem
  view: 'grid2' | 'grid3' | 'list'
  onEdit: (item: LinkItem) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: LinkItem['status']) => void
  onPriceHistory: () => void
  onToggleFavorite: (id: string, val: boolean) => void
}

const STATUS_CONFIG = {
  wish: { label: '위시', color: 'bg-amber-50 text-amber-700', icon: Heart },
  bought: { label: '구매완료', color: 'bg-green-50 text-green-700', icon: ShoppingBag },
  archived: { label: '보관', color: 'bg-gray-100 text-gray-500', icon: Archive },
}

function formatPrice(p: string | null) {
  if (!p) return null
  const num = parseInt(p.replace(/[^0-9]/g, ''))
  if (isNaN(num)) return p
  return '₩' + num.toLocaleString('ko-KR')
}

export default function LinkCard({ item, view, onEdit, onDelete, onStatusChange, onPriceHistory, onToggleFavorite }: Props) {
  const status = STATUS_CONFIG[item.status]
  const StatusIcon = status.icon
  const hasPriceChange = item.last_price && item.last_price !== item.price
  const displayPrice = formatPrice(item.price)

  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-3 hover:border-gray-200 transition-colors group">
        {/* 썸네일 */}
        <div className="w-14 h-14 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {item.thumbnail
            ? <Image src={item.thumbnail} alt="" width={56} height={56} className="object-cover w-full h-full" unoptimized />
            : <span className="text-2xl">🔗</span>}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-1 block transition-colors">
            {item.title}
          </a>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-400">{item.site_name || getSiteLabel(item.url)}</span>
            {displayPrice && (
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                {displayPrice}
                {hasPriceChange && (
                  <button onClick={onPriceHistory}><TrendingDown size={10} className="text-green-500" /></button>
                )}
              </span>
            )}
            {item.tags?.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {item.tags.slice(0, 2).map(t => (
                  <span key={t} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 액션 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onToggleFavorite(item.id, !item.is_favorite)}
            className={`p-1.5 rounded-lg transition-colors ${item.is_favorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
            <Star size={14} fill={item.is_favorite ? 'currentColor' : 'none'} />
          </button>
          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
            <StatusIcon size={10} />{status.label}
          </span>
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )
  }

  // 그리드 뷰
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group flex flex-col relative">
      {/* 즐겨찾기 버튼 */}
      <button
        onClick={() => onToggleFavorite(item.id, !item.is_favorite)}
        className={`absolute top-2 left-2 z-10 p-1.5 rounded-full backdrop-blur-sm transition-all ${
          item.is_favorite
            ? 'bg-yellow-400 text-white shadow-sm'
            : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Star size={12} fill={item.is_favorite ? 'currentColor' : 'none'} />
      </button>

      {/* 썸네일 - 클릭하면 링크 이동 */}
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
          {item.thumbnail
            ? <Image src={item.thumbnail} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
            : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                {item.favicon && <Image src={item.favicon} alt="" width={28} height={28} unoptimized />}
                <span className="text-xs text-gray-400">{item.site_name || getSiteLabel(item.url)}</span>
              </div>
            )}
        </div>
      </a>

      <div className="p-3 flex flex-col flex-1">
        {/* 사이트명 */}
        <div className="flex items-center gap-1 mb-1">
          {item.favicon && <Image src={item.favicon} alt="" width={11} height={11} unoptimized className="rounded-sm opacity-70" />}
          <span className="text-[10px] text-gray-400 uppercase tracking-wide truncate">{item.site_name || getSiteLabel(item.url)}</span>
        </div>

        {/* 제목 - 클릭 시 링크 이동 */}
        <a href={item.url} target="_blank" rel="noopener noreferrer"
          className="text-sm font-semibold text-gray-900 leading-snug mb-2 flex-1 line-clamp-2 hover:text-blue-600 transition-colors block">
          {item.title}
        </a>

        {/* 가격 - ₩ 원화 표시 */}
        {displayPrice && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm font-bold text-blue-600">{displayPrice}</span>
            {hasPriceChange && (
              <button onClick={onPriceHistory} className="flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                <TrendingDown size={9} />변동
              </button>
            )}
          </div>
        )}

        {/* 태그 */}
        {item.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Tag size={8} />{t}
              </span>
            ))}
          </div>
        )}

        {/* 하단 */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1">
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>
            <button
              onClick={() => {
                const next = item.status === 'wish' ? 'bought' : item.status === 'bought' ? 'archived' : 'wish'
                onStatusChange(item.id, next)
              }}
              className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5 ${status.color}`}
            >
              <StatusIcon size={8} />{status.label}
            </button>
          </div>
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
