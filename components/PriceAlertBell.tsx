'use client'
import { useState, useEffect } from 'react'
import { Bell, X, TrendingDown, TrendingUp, Check, Trash2 } from 'lucide-react'
import { PriceAlert } from '@/types'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d >= 1) return `${d}일 전`
  if (h >= 1) return `${h}시간 전`
  return '방금'
}

function parsePrice(p: string | null) {
  if (!p) return 0
  return parseInt(p.replace(/[^0-9]/g, '')) || 0
}

export default function PriceAlertBell() {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(false)

  const unread = alerts.filter(a => !a.is_read).length

  const fetchAlerts = async () => {
    setLoading(true)
    const res = await fetch('/api/price-alerts')
    if (res.ok) setAlerts(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchAlerts() }, [])

  const markRead = async (id: string) => {
    await fetch('/api/price-alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
  }

  const clearAll = async () => {
    await fetch('/api/price-alerts', { method: 'DELETE' })
    setAlerts([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(v => !v); if (!open) fetchAlerts() }}
        className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-80 w-auto bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">가격 변동 알림</span>
                {unread > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{unread}개 새 알림</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {alerts.length > 0 && (
                  <button onClick={clearAll} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="전체 삭제">
                    <Trash2 size={13} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>
              ) : alerts.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={28} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400">가격 변동 알림이 없어요</p>
                  <p className="text-xs text-gray-300 mt-1">가격 수정 시 여기에 표시돼요</p>
                </div>
              ) : (
                alerts.map(alert => {
                  const oldP = parsePrice(alert.old_price)
                  const newP = parsePrice(alert.new_price)
                  const isDown = newP < oldP
                  return (
                    <div
                      key={alert.id}
                      onClick={() => markRead(alert.id)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!alert.is_read ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDown ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isDown
                          ? <TrendingDown size={14} className="text-green-600" />
                          : <TrendingUp size={14} className="text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{alert.link_title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-400 line-through">{alert.old_price || '미입력'}</span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className={`text-xs font-bold ${isDown ? 'text-green-600' : 'text-red-500'}`}>
                            {alert.new_price || '미입력'}
                          </span>
                          {oldP > 0 && newP > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDown ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {isDown ? '-' : '+'}{Math.abs(newP - oldP).toLocaleString()}원
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(alert.created_at)} · 7일 후 자동 삭제</p>
                      </div>
                      {!alert.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {alerts.length > 0 && (
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 text-center">알림은 7일 후 자동으로 삭제돼요</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}