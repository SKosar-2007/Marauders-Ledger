import { useQuery } from '@tanstack/react-query'
import { getSpendingByDay, getSpendingByCategory } from '../api/client'

export default function Analysis() {
  const { data: spendingByDay } = useQuery({ queryKey: ['spending-day'], queryFn: () => getSpendingByDay(30) })
  const { data: spendingByCat } = useQuery({ queryKey: ['spending-cat'], queryFn: () => getSpendingByCategory() })

  const dailyData = Array.isArray(spendingByDay) ? spendingByDay : []
  const catData = Array.isArray(spendingByCat) ? spendingByCat : []

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <h1 className="font-display text-5xl font-bold uppercase tracking-tighter text-primary mb-8">Data Analysis Hub</h1>

        <div className="grid grid-cols-12 gap-gutter mb-gutter">
          <div className="col-span-12 xl:col-span-8 bg-surface-container-lowest border-[3px] border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-8 bg-primary border-b-[3px] border-primary flex items-center justify-between px-4">
              <span className="font-display text-sm font-bold text-on-primary uppercase tracking-wider">Temporal Trend Analysis</span>
              <div className="flex gap-2">
                <span className="w-3 h-3 bg-secondary-container border-2 border-primary" />
                <span className="w-3 h-3 bg-tertiary-fixed-dim border-2 border-primary" />
              </div>
            </div>
            <div className="pt-12 p-gutter min-h-[400px] flex flex-col justify-between">
              <div className="flex justify-between items-end mb-8 relative z-10">
                <div>
                  <h2 className="font-display text-5xl font-bold text-primary leading-none">
                    {dailyData.length > 0 ? dailyData.reduce((s: number, d: any) => s + (d.total || 0), 0).toLocaleString('en-US') : '42.8'}
                    <span className="text-lg text-outline">K</span>
                  </h2>
                  <p className="font-mono text-xs text-on-surface-variant uppercase mt-2">Aggregated Data Points (T-30)</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 bg-error-container border-2 border-primary px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-error text-[18px]">trending_up</span>
                    <span className="font-mono text-sm text-error">+14.2%</span>
                  </div>
                </div>
              </div>
              <div className="relative w-full h-[240px] mt-auto">
                <div className="absolute inset-0 grid grid-cols-6 gap-0">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`border-r border-primary/20 border-dashed h-full ${i === 5 ? 'border-r-0' : ''}`} />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border-b border-primary/20 border-dashed w-full" />
                  ))}
                </div>
                <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 1000 240">
                  <polyline fill="none" points="0,200 100,180 200,220 300,120 400,150 500,40 600,90 700,30 800,110 900,60 1000,10"
                    stroke="#00dddd" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="6" />
                  {[[500, 40], [700, 30], [1000, 10]].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} fill="#fcd400" r="8" stroke="#000" strokeWidth="3" />
                  ))}
                </svg>
              </div>
              <div className="flex justify-between mt-4 font-mono text-xs text-on-surface-variant pt-2 border-t-2 border-primary">
                <span>T-30</span><span>T-20</span><span>T-10</span><span>T-5</span><span>Now</span>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <div className="bg-primary px-4 py-2 border-b-[3px] border-primary">
              <h2 className="font-display text-sm font-bold text-on-primary uppercase">Category Breakdown</h2>
            </div>
            <div className="p-6 flex-1 space-y-4">
              {catData.length > 0 ? catData.slice(0, 6).map((c, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs uppercase text-on-surface">{c.category || c.name}</span>
                    <span className="font-mono text-sm font-bold text-primary">{c.total?.toFixed(2) || '0'} G</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container border-2 border-primary">
                    <div className="h-full bg-secondary-container border-r-2 border-primary" style={{ width: `${Math.min(100, (c.percentage || c.total / 1000) * 100)}%` }} />
                  </div>
                </div>
              )) : ['Food', 'Shopping', 'Bills', 'Transport', 'Entertainment', 'Other'].map((cat, i) => (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs uppercase text-on-surface">{cat}</span>
                    <span className="font-mono text-sm font-bold text-primary">-- G</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container border-2 border-primary">
                    <div className="h-full bg-secondary-container border-r-2 border-primary" style={{ width: `${20 + i * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
