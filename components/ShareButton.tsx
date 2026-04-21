'use client'
import { useState } from 'react'
import { Share2, Copy, Check, X } from 'lucide-react'

interface Props {
  filter: string
  category: string
}

export default function ShareButton({ filter, category }: Props) {
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleShare = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter, category }),
      })
      const data = await res.json()
      setShareUrl(data.url)
      setOpen(true)
    } catch {
      alert('공유 링크 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 transition-all"
      >
        <Share2 size={13} />
        {loading ? '생성 중...' : '공유'}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">위시리스트 공유</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">아래 링크를 복사해서 공유하세요. 링크를 가진 누구나 볼 수 있어요.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-600 truncate"
              />
              <button
                onClick={handleCopy}
                className={`h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? <><Check size={13} /> 복사됨</> : <><Copy size={13} /> 복사</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
