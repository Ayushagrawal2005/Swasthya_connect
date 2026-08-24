export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-5 animate-pulse" aria-label="Loading content" aria-busy="true">
      <div className="skeleton h-4 w-2/3 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 mb-2 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}
