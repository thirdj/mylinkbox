'use client'
import { useState, useEffect } from 'react'
import { X, TrendingDown, Tag, Plus } from 'lucide-react'
import { LinkItem } from '@/types'

interface Props {
  item: LinkItem | null
  categories: string[]
  onSave: (id: string, updates: Partial<LinkItem>) => void
  onClose: () => void
  onPriceHistory?: () => void
}

export default function EditModal({ item, categories, onSave, onClose, onPriceHistory }: Props) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<LinkItem['status']>('wish')
  const [memo, setMemo] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setPrice(item.price || '')
      setCategory(item.category)
      setStatus(item.status)
      setMemo(item.memo || '')
      setTags(item.tags || [])
    }
  }, [item])

  if (!item) return null

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t))

  const handleSave = () => {
    onSave(item.id, { title, price: price || null, category, status, memo: memo || null, tags })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-900">항목 수정</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">제목</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">가격</label>
              {item.last_price && onPriceHistory && (
                <button onClick={onPriceHistory} className="text-xs text-blue-600 flex items-center gap-1">
                  <TrendingDown size={11} /> 변동 내역
                </button>
              )}
            </div>
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="예: 39000"
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            {item.last_price && item.last_price !== item.price && (
              <p className="text-xs text-gray-400 mt-1">이전: {item.last_price}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">카테고리</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full h-10 px-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">상태</label>
              <select value={status} onChange={e => setStatus(e.target.value as LinkItem['status'])}
                className="w-full h-10 px-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none">
                <option value="wish">위시리스트</option>
                <option value="bought">구매완료</option>
                <option value="archived">보관함</option>
              </select>
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5 flex items-center gap-1">
              <Tag size={11} /> 태그
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="태그 입력 후 Enter"
                className="flex-1 h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button onClick={addTag} className="h-9 w-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700">
                <Plus size={14} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-500 text-purple-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">메모</label>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={2} placeholder="메모..."
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none resize-none" />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="h-11 px-5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">취소</button>
          <button onClick={handleSave} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl">저장</button>
        </div>
      </div>
    </div>
  )
}
