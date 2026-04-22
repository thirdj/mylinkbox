'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Loader2, Link2, AlertCircle, Upload, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { LinkItem, OGData } from '@/types'

interface Props {
  categories: string[]
  onAdd: (item: Omit<LinkItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ duplicate?: boolean }>
  defaultOpen?: boolean
  onClose?: () => void
}

export default function AddLinkBar({ categories, onAdd, defaultOpen = false, onClose }: Props) {
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const fileRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [url, setUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [og, setOg] = useState<OGData | null>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('기타')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setStep('input')
    setUrl('')
    setOg(null)
    setTitle('')
    setPrice('')
    setCategory('기타')
    setFetchError('')
    setError('')
    setThumbnailPreview(null)
    setThumbnailUrl(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onClose?.()
  }

  const fetchOG = async (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    try { new URL(trimmed) } catch { return }
    setFetching(true)
    setFetchError('')
    try {
      const res = await fetch('/api/og-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const data: OGData = await res.json()
      setOg(data)
      setTitle(data.title || '')
      setThumbnailPreview(data.thumbnail || null)
      setThumbnailUrl(data.thumbnail || null)
      setStep('confirm')
    } catch {
      setFetchError('링크 정보를 가져오지 못했어요.')
    } finally {
      setFetching(false)
    }
  }

  const handleUrlChange = (val: string) => {
    setUrl(val)
    setFetchError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    try {
      new URL(val.trim())
      debounceRef.current = setTimeout(() => fetchOG(val), 600)
    } catch { /* not URL yet */ }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    try {
      new URL(pasted.trim())
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setTimeout(() => fetchOG(pasted.trim()), 100)
    } catch { /* not URL */ }
  }

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      const b64 = e.target?.result as string
      setThumbnailPreview(b64)
      setThumbnailUrl(b64)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    setSaving(true)
    setError('')
    try {
      const result = await onAdd({
        url: url.trim(), title,
        description: og?.description ?? null,
        thumbnail: thumbnailUrl,
        site_name: og?.site_name ?? null,
        favicon: og?.favicon ?? null,
        price: price || null,
        last_price: null, price_updated_at: null,
        category, tags: [], is_favorite: false,
        status: 'wish', memo: null,
      })
      if (result.duplicate) setError('이미 저장된 링크입니다.')
      else handleClose()
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (!defaultOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {step === 'confirm' && (
              <button onClick={() => { setStep('input'); setFetching(false) }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 text-lg mr-1">←</button>
            )}
            <h2 className="text-base font-semibold text-gray-900">
              {step === 'input' ? '링크 추가' : '저장 확인'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* STEP 1 */}
        {step === 'input' && (
          <div className="px-5 py-6">
            <label className="text-xs font-medium text-gray-500 block mb-2">쇼핑몰 링크</label>
            <div className="relative">
              <Link2 size={14} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                autoFocus
                type="url"
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                onPaste={handlePaste}
                placeholder="링크를 붙여넣으면 자동으로 가져와요"
                className="w-full h-12 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            {fetchError && <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600"><AlertCircle size={12} />{fetchError}</div>}
            {fetching && (
              <div className="mt-8 flex flex-col items-center gap-3 py-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-sm text-gray-400">정보를 가져오는 중...</p>
              </div>
            )}
            {!fetching && url && (
              <button onClick={() => fetchOG(url)} className="mt-3 w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2">
                수동으로 가져오기
              </button>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 'confirm' && og && (
          <div className="px-5 py-5 space-y-4">
            {/* 썸네일 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500">썸네일</label>
                <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 flex items-center gap-1">
                  <Upload size={11} /> 직접 업로드
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }} />
              <div
                className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer relative group border-2 border-dashed border-transparent hover:border-blue-300"
                onClick={() => fileRef.current?.click()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f) }}
                onDragOver={e => e.preventDefault()}
              >
                {thumbnailPreview ? (
                  <>
                    <Image src={thumbnailPreview} alt="썸네일" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1">
                      <Upload size={20} className="text-white" />
                      <p className="text-white text-xs">클릭하여 변경</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ImageIcon size={28} className="text-gray-300" />
                    <p className="text-xs text-center">이미지 없음 · <span className="text-blue-500">클릭</span>하여 추가</p>
                  </div>
                )}
              </div>
              <input type="url" placeholder="또는 이미지 URL 직접 입력..."
                value={thumbnailUrl?.startsWith('data:') ? '' : (thumbnailUrl || '')}
                onChange={e => { setThumbnailUrl(e.target.value || null); setThumbnailPreview(e.target.value || null) }}
                className="mt-2 w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">제목</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full h-11 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">가격 (선택)</label>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="예: 39000"
                  className="w-full h-11 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">카테고리</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full h-11 px-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none">
                  {['기타', ...categories].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              {og.favicon && <Image src={og.favicon} alt="" width={12} height={12} unoptimized className="rounded-sm" />}
              <span>{og.site_name}</span>
              <span className="text-gray-200">·</span>
              <span className="truncate text-[11px]">{url}</span>
            </div>

            {error && <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={12} />{error}</div>}

            <button onClick={handleSave} disabled={saving}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
