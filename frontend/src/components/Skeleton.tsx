export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#735c00]/10 rounded ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-[#faf3e6] rounded-xl p-6 shadow-md space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[#faf3e6] rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-3 border-b border-[#735c00]/20 flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-3 flex-1" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-[#735c00]/10 flex gap-4">
          {Array.from({ length: 5 }).map((_, j) => <Skeleton key={j} className="h-3 flex-1" />)}
        </div>
      ))}
    </div>
  )
}

export function MapSkeleton() {
  return (
    <div className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
      <Skeleton className="h-6 w-1/4 mb-4" />
      <div className="relative h-[400px] bg-[#2c1810]/5 rounded-lg overflow-hidden">
        <svg viewBox="0 0 500 400" className="w-full h-full opacity-20">
          <rect x="50" y="50" width="100" height="80" rx="8" fill="#735c00" opacity="0.3" />
          <rect x="200" y="100" width="120" height="60" rx="8" fill="#735c00" opacity="0.3" />
          <rect x="350" y="150" width="90" height="70" rx="8" fill="#735c00" opacity="0.3" />
          <rect x="100" y="250" width="110" height="50" rx="8" fill="#735c00" opacity="0.3" />
          <rect x="300" y="280" width="100" height="60" rx="8" fill="#735c00" opacity="0.3" />
        </svg>
      </div>
    </div>
  )
}

export function GaugeSkeleton() {
  return (
    <div className="bg-[#faf3e6] rounded-xl p-6 shadow-md text-center">
      <Skeleton className="h-4 w-1/2 mx-auto mb-4" />
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#735c00]/10" />
      <Skeleton className="h-3 w-2/3 mx-auto" />
    </div>
  )
}
