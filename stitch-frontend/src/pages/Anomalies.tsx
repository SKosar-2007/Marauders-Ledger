import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getAnomalies, updateAnomalyStatus, SEVERITY_CONFIG, type NarrativeSeverity } from '../api/client'
import { LoadingSkeleton, EmptyState } from '../components/ui'

const CATEGORIES = ['All', 'Food', 'Shopping', 'Bills', 'Transport', 'Entertainment', 'Other']
const SORT_OPTIONS = ['Newest', 'Highest Score', 'Lowest Score']

function getSeverity(score?: number): NarrativeSeverity {
  if (!score || score < 30) return 'low'
  if (score < 60) return 'medium'
  if (score < 80) return 'high'
  return 'critical'
}

export default function Anomalies() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeSort, setActiveSort] = useState('Newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const { data: anomalies, isLoading } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => getAnomalies({ limit: 50 }),
  })

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      await Promise.all(ids.map((id) => updateAnomalyStatus(id, status)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] })
      setSelectedIds(new Set())
    },
  })

  const filtered = useMemo(() => {
    let list = Array.isArray(anomalies) ? [...anomalies] : []
    if (activeCategory !== 'All') {
      list = list.filter((a) => a.category?.toLowerCase() === activeCategory.toLowerCase())
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((a) =>
        a.merchant?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.anomaly_id.toString().includes(q)
      )
    }
    if (activeSort === 'Highest Score') list.sort((a, b) => (b.score || 0) - (a.score || 0))
    else if (activeSort === 'Lowest Score') list.sort((a, b) => (a.score || 0) - (b.score || 0))
    else list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    return list
  }, [anomalies, activeCategory, activeSort, searchQuery])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleBulkStatus = (status: string) => {
    if (selectedIds.size === 0) return
    bulkStatusMutation.mutate({ ids: Array.from(selectedIds), status })
  }

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="font-display text-5xl font-bold uppercase tracking-tighter text-primary">Anomaly Watchlist</h1>
            <p className="font-body text-base text-on-surface-variant mt-2">
              {filtered.length} of {Array.isArray(anomalies) ? anomalies.length : 0} anomalies
              {selectedIds.size > 0 && <span className="text-primary ml-2">&mdash; {selectedIds.size} selected</span>}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant pointer-events-none">search</span>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 border-[3px] border-primary bg-surface-container-lowest px-8 py-2 font-mono text-xs uppercase outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-0.5 focus:translate-y-0.5 transition-all"
                placeholder="Search..." />
            </div>
            <div className="relative">
              <select value={activeSort} onChange={(e) => setActiveSort(e.target.value)}
                className="appearance-none border-[3px] border-primary bg-surface-container-lowest px-4 py-2 pr-8 font-mono text-xs uppercase outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-sm">arrow_drop_down</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`font-mono text-xs uppercase px-4 py-2 border-[3px] border-primary transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none ${
                activeCategory === cat ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-secondary-fixed hover:text-on-secondary-fixed'
              }`}>
              {cat === 'All' ? `All (${Array.isArray(anomalies) ? anomalies.length : 0})` : cat}
            </button>
          ))}
          {selectedIds.size > 0 && (
            <div className="flex gap-2 ml-auto">
              <button onClick={() => handleBulkStatus('valid')} disabled={bulkStatusMutation.isPending}
                className="px-4 py-2 border-[3px] border-primary bg-secondary-container text-on-secondary-container font-mono text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {bulkStatusMutation.isPending ? 'Updating...' : `Mark Valid (${selectedIds.size})`}
              </button>
              <button onClick={() => handleBulkStatus('fraud')} disabled={bulkStatusMutation.isPending}
                className="px-4 py-2 border-[3px] border-primary bg-error text-on-error font-mono text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {bulkStatusMutation.isPending ? 'Updating...' : `Flag Fraud (${selectedIds.size})`}
              </button>
              <button onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 border-[3px] border-primary bg-surface-container text-on-surface font-mono text-xs uppercase hover:bg-surface-variant transition-all">
                Clear
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <LoadingSkeleton key={i} lines={2} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-gutter" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
            {filtered.map((a, idx) => {
              const sev = getSeverity(a.score)
              const cfg = SEVERITY_CONFIG[sev]
              const isSelected = selectedIds.has(a.anomaly_id)
              return (
                <div key={a.anomaly_id}
                  className={`bg-surface-container-lowest border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group ${
                    isSelected ? 'ring-4 ring-secondary-container -translate-x-1 -translate-y-1 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]' : 'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className={`flex items-center justify-between px-6 py-4 border-b-[3px] border-primary ${sev === 'critical' ? 'bg-error' : 'bg-primary'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => navigate(`/anomaly/${a.anomaly_id}`)}>
                      <span className={`material-symbols-outlined text-on-primary ${sev === 'critical' ? 'animate-pulse' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                      <h3 className="font-display text-base font-bold text-on-primary uppercase truncate">ANOM-{a.anomaly_id}</h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1 border-[2px] font-mono text-xs uppercase ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      <span className={`font-mono text-xs px-3 py-1 border-[2px] ${
                        a.status === 'fraud' ? 'bg-error text-on-error border-primary' :
                        a.status === 'valid' ? 'bg-secondary-container text-on-secondary-container border-primary' :
                        'bg-tertiary-fixed text-on-tertiary-fixed border-primary'
                      }`}>
                        {a.status?.toUpperCase() || 'PENDING'}
                      </span>
                      <label onClick={(e) => e.stopPropagation()} className={`w-5 h-5 border-[3px] border-primary cursor-pointer flex items-center justify-center transition-all ${isSelected ? 'bg-secondary-container border-secondary-container' : 'bg-surface hover:bg-surface-variant'}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(a.anomaly_id)} className="sr-only" />
                        {isSelected && <span className="material-symbols-outlined text-[14px] text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                      </label>
                    </div>
                  </div>
                  <div className="p-6" onClick={() => navigate(`/anomaly/${a.anomaly_id}`)}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-on-surface-variant">Amount</span>
                        <p className="font-mono text-sm font-bold text-primary">{a.amount?.toFixed(2)} G</p>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-on-surface-variant">Category</span>
                        <p className="font-body text-sm text-on-surface">{a.category}</p>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-on-surface-variant">Merchant</span>
                        <p className="font-body text-sm text-on-surface">{a.merchant}</p>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-on-surface-variant">Score</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 border-[2px] border-primary bg-surface-container-higher max-w-[80px]">
                            <div className={`h-full ${sev === 'critical' ? 'bg-error' : sev === 'high' ? 'bg-secondary' : sev === 'medium' ? 'bg-secondary-container' : 'bg-tertiary-fixed'} border-r-[2px] border-primary transition-all`}
                              style={{ width: `${a.score || 0}%` }} />
                          </div>
                          <p className="font-mono text-sm font-bold text-primary">{a.score?.toFixed(0) || 'N/A'}%</p>
                        </div>
                      </div>
                    </div>
                    {Array.isArray(a.triggered_rules) && a.triggered_rules.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {a.triggered_rules.map((r, i) => (
                          <span key={i} className="font-mono text-[10px] uppercase border-[2px] border-primary px-2 py-0.5 bg-surface-container flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-colors">
                            <span className="material-symbols-outlined text-[12px] text-current">rule</span>
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState icon={searchQuery ? 'search_off' : 'check_circle'}
            title={searchQuery ? 'No Matches' : 'All Clear'}
            desc={searchQuery ? `No anomalies match "${searchQuery}". Try a different search term.` : 'No anomalies detected. Upload a CSV transaction file on the landing page to begin analysis.'}
            action={searchQuery ? { label: 'Clear Search', onClick: () => setSearchQuery('') } : undefined}
          />
        )}
      </div>
    </div>
  )
}
