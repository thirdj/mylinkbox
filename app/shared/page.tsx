'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Package } from 'lucide-react'
import Image from 'next/image'
import { LinkItem } from '@/types'
import { getSiteLabel } from '@/lib/utils'

function SharedContent() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const filter = searchParams.get('filter') || 'all'
  const category = searchParams.get('category') || '전체'

  useEffect(() => {
    fetch(`/api/shared?${searchParams.toString()}`)
      .then(r => r.json())
      .then(data => { if (data.error) setError(data.error); else setItems(data); setLoading(false) })
      .catch(() => { setError('불러오기 실패'); setLoading(false) })
  }, [searchParams])

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">{error}</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-blue-600" />
            <span className="font-semibold text-gray-900">MyLinkBox</span>
            <span className="text-xs text-gray-400 ml-1">공유된 위시리스트</span>
          </div>
          <a href="/auth" className="text-xs text-blue-600 hover:underline">나도 만들기 →</a>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          {filter !== 'all' && <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full">{filter === 'wish' ? '위시리스트' : filter}</span>}
          {category !== '전체' && <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{category}</span>}
          <span className="text-xs text-gray-400">{items.length}개</span>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">공유된 항목이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(item => (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all flex flex-col">
                <div className="relative aspect-[16/10] bg-gray-50">
                  {item.thumbnail
                    ? <Image src={item.thumbnail} alt={item.title} fill className="object-cover" unoptimized />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={24} /></div>}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-xs text-gray-400 mb-1">{item.site_name || getSiteLabel(item.url)}</p>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">{item.title}</p>
                  {item.price && <p className="text-sm font-semibold text-blue-600 mt-1.5">{item.price}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function SharedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <SharedContent />
    </Suspense>
  )
}
