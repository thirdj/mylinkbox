'use client'
import { useState, useEffect } from 'react'
import { X, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { PriceHistory } from '@/types'

interface Props {
  linkId: string | null
  linkTitle: string
  onClose: () => void
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function parsePrice(p: string | null): number {
  if (!p) return 0
  return parseInt(p.replace(/[^0-9]/g, '')) || 0
}

export default function PriceHistoryModal({ linkId, linkTitle, onClose }: Props) {
  const [history, setHistory] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!linkId) return
    fetch(`/api/price-history?link_id=${linkId}`)
      .then(r => r.json())
      .then(data => { setHistory(data); setLoading(false) })
  }, [linkId])

  if (!linkId) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[80vh]"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">가격 변동 내역</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{linkTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] px-5 py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">가격 변동 내역이 없습니다.</p>
              <p className="text-xs mt-1">수정에서 가격을 변경하면 여기에 기록돼요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h, i) => {
                const oldP = parsePrice(h.old_price)
                const newP = parsePrice(h.new_price)
                const diff = newP - oldP
                const isDown = diff < 0
                const isUp = diff > 0

                return (
                  <div key={h.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isDown ? 'bg-green-100' : isUp ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {isDown ? <TrendingDown size={14} className="text-green-600" /> :
                       isUp ? <TrendingUp size={14} className="text-red-500" /> :
                       <Minus size={14} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500 line-through">{h.old_price || '미입력'}</span>
                        <span className="text-xs text-gray-400">→</span>
                        <span className="text-sm font-medium text-gray-900">{h.new_price || '미입력'}</span>
                        {diff !== 0 && (
                          <span className={`text-xs font-medium ${isDown ? 'text-green-600' : 'text-red-500'}`}>
                            {isDown ? '' : '+'}{diff.toLocaleString()}원
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.changed_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
