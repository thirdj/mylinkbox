'use client'
import { useState, useRef } from 'react'
import { X, Download, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onImportDone: () => void
}

export default function ImportExportModal({ onClose, onImportDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ importedLinks: number; importedCats: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  const handleExport = async () => {
    const res = await fetch('/api/export')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `damoajo-export-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setError('')
    setResult(null)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
      onImportDone()
    } catch {
      setError('파일 형식이 올바르지 않습니다.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">데이터 내보내기 / 가져오기</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="px-5 py-5 space-y-3">
          {/* 내보내기 */}
          <button onClick={handleExport}
            className="w-full h-12 flex items-center gap-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors">
            <Download size={18} />
            <div className="text-left">
              <p className="text-sm font-semibold">내보내기</p>
              <p className="text-xs text-blue-500">전체 데이터를 JSON 파일로 저장</p>
            </div>
          </button>

          {/* 가져오기 */}
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="w-full h-12 flex items-center gap-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors disabled:opacity-60">
            {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <div className="text-left">
              <p className="text-sm font-semibold">가져오기</p>
              <p className="text-xs text-gray-400">JSON 파일에서 데이터 불러오기</p>
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          {/* 결과 */}
          {result && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">
                링크 {result.importedLinks}개, 카테고리 {result.importedCats}개 가져옴
                {result.skipped > 0 && ` (중복 ${result.skipped}개 건너뜀)`}
              </p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">내보낸 파일은 다시 가져오기로 복원할 수 있어요</p>
        </div>
      </div>
    </div>
  )
}
