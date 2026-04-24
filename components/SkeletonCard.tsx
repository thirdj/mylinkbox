export default function SkeletonCard({ view }: { view: 'grid2' | 'grid3' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-3 animate-pulse">
        <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded-full w-3/4" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        </div>
        <div className="w-16 h-6 bg-gray-100 rounded-full" />
      </div>
    )
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse flex flex-col">
      <div className="aspect-[4/3] bg-gray-200 w-full flex-shrink-0" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
        <div className="h-3.5 bg-gray-200 rounded-full w-full" />
        <div className="h-3.5 bg-gray-200 rounded-full w-4/5" />
        <div className="h-4 bg-gray-100 rounded-full w-1/3 mt-1" />
      </div>
    </div>
  )
}