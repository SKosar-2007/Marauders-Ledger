export function LoadingSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`border-[3px] border-primary bg-surface-container-lowest p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-surface-container-higher border-b-[2px] border-primary w-1/3" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 bg-surface-container-higher border-b-[2px] border-primary" style={{ width: `${70 - i * 15}%` }} />
        ))}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, desc, action }: { icon: string; title: string; desc: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="border-[3px] border-primary bg-surface-container-lowest p-12 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,251,251,0.05),transparent_70%)] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-20 h-20 border-[3px] border-primary bg-surface-container flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-6 transition-transform">
          <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <h3 className="font-display text-xl font-bold text-primary uppercase">{title}</h3>
        <p className="font-mono text-sm text-on-surface-variant max-w-md">{desc}</p>
        {action && (
          <button onClick={action.onClick}
            className="mt-4 px-8 py-3 border-[3px] border-primary bg-primary text-on-primary font-mono text-xs uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

export function StatusBadge({ label, variant }: { label: string; variant?: 'success' | 'warning' | 'error' | 'info' | 'pending' }) {
  const styles = {
    success: 'bg-tertiary-fixed text-on-tertiary-fixed border-primary',
    warning: 'bg-secondary-container text-on-secondary-container border-primary',
    error: 'bg-error text-on-error border-primary',
    info: 'bg-primary text-on-primary border-primary',
    pending: 'bg-surface-container text-on-surface border-outline',
  }
  const icons = { success: 'check_circle', warning: 'warning', error: 'close', info: 'info', pending: 'schedule' }
  const s = variant || 'info'
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2 py-1 border-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${styles[s]}`}>
      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icons[s]}</span>
      {label}
    </span>
  )
}

export function ProgressBar({ value, max = 100, color = 'bg-primary', label }: { value: number; max?: number; color?: string; label?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="w-full">
      {label && <div className="flex justify-between font-mono text-xs text-on-surface-variant mb-1 uppercase"><span>{label}</span><span>{Math.round(pct)}%</span></div>}
      <div className="w-full h-3 border-[3px] border-primary bg-surface-container-higher overflow-hidden">
        <div className={`h-full ${color} border-r-[3px] border-primary transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function MiniSparkline({ data, color = 'bg-tertiary-fixed', height = 8 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className={`flex-1 ${color} border-t-[2px] border-primary min-w-[3px] transition-all hover:opacity-80`}
          style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  )
}
