import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getTransactions, getAnomalies } from '../api/client'
import { LoadingSkeleton, EmptyState, StatusBadge } from '../components/ui'

const CATEGORIES = ['All', 'Food', 'Shopping', 'Bills', 'Transport', 'Entertainment', 'Other']
const PAGE_SIZE = 15

export default function Transactions() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [sortKey, setSortKey] = useState<string>('timestamp')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions({ limit: 100 }),
  })
  const { data: anomalies } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => getAnomalies({ limit: 500 }),
  })

  const anomalyByTxn = useMemo(() => {
    const map = new Map<number, any>()
    if (Array.isArray(anomalies)) {
      anomalies.forEach((a) => {
        const id = Number(a.anomaly_id)
        if (!isNaN(id)) map.set(id, a)
      })
    }
    return map
  }, [anomalies])

  const filtered = useMemo(() => {
    let list = Array.isArray(transactions) ? [...transactions] : []
    if (activeCat !== 'All') {
      list = list.filter((tx) => tx.category?.toLowerCase() === activeCat.toLowerCase())
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((tx) =>
        tx.merchant?.toLowerCase().includes(q) ||
        tx.category?.toLowerCase().includes(q) ||
        tx.txn_id?.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      let av: any, bv: any
      if (sortKey === 'amount') { av = a.amount; bv = b.amount }
      else if (sortKey === 'merchant') { av = a.merchant || ''; bv = b.merchant || '' }
      else if (sortKey === 'category') { av = a.category || ''; bv = b.category || '' }
      else { av = a.timestamp || ''; bv = b.timestamp || '' }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? (av || 0) - (bv || 0) : (bv || 0) - (av || 0)
    })
    return list
  }, [transactions, activeCat, search, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-5xl font-bold uppercase tracking-tighter text-primary">Ledger Archive</h1>
          <span className="font-mono text-xs text-on-surface-variant">{filtered.length} transactions</span>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => { setActiveCat(cat); setPage(0) }}
                className={`font-mono text-xs uppercase px-3 py-1.5 border-[3px] border-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all ${
                  activeCat === cat ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-secondary-fixed'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant pointer-events-none">search</span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full border-[3px] border-primary bg-surface-container-lowest px-8 py-2 font-mono text-xs outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-0.5 focus:translate-y-0.5 transition-all"
              placeholder="Search merchant, category, or ID..." />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <LoadingSkeleton key={i} lines={1} className="!p-4" />)}
          </div>
        ) : paged.length > 0 ? (
          <div className="bg-surface-container-lowest border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b-[3px] border-primary text-on-surface-variant font-mono text-xs uppercase tracking-wider">
                    {[
                      { key: 'txn_id', label: 'TX ID', w: 'w-[15%]' },
                      { key: 'amount', label: 'Amount', w: 'w-[12%]' },
                      { key: 'category', label: 'Category', w: 'w-[15%]' },
                      { key: 'merchant', label: 'Merchant', w: 'w-[22%]' },
                      { key: 'timestamp', label: 'Date', w: 'w-[18%]' },
                      { key: 'status', label: 'Status', w: 'w-[18%]' },
                    ].map((col) => (
                      <th key={col.key} onClick={() => col.key !== 'status' && toggleSort(col.key)}
                        className={`py-4 px-6 font-bold ${col.key !== 'status' ? 'cursor-pointer hover:bg-surface-variant transition-colors' : ''} ${col.w}`}>
                        <div className="flex items-center gap-1">
                          {col.label}
                          {sortKey === col.key && (
                            <span className="material-symbols-outlined text-[12px]">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((tx, i) => {
                    const tid = Number(tx.txn_id)
                    const anomaly = anomalyByTxn.get(tid)
                    return (
                      <tr key={tx.txn_id || i}
                        className={`border-b border-primary/20 hover:bg-surface-variant transition-colors cursor-pointer ${anomaly ? 'bg-error-container/20' : ''}`}
                        onClick={() => anomaly && navigate(`/anomaly/${anomaly.anomaly_id}`)}
                        style={{ animation: `fadeSlideIn 0.2s ease-out ${i * 0.02}s both` }}>
                        <td className="py-4 px-6 font-mono text-sm">{tx.txn_id?.slice(0, 12) || '---'}</td>
                        <td className={`py-4 px-6 font-mono text-sm font-bold ${anomaly ? 'text-error' : 'text-primary'}`}>
                          {tx.amount?.toFixed(2) || '0.00'} G
                        </td>
                        <td className="py-4 px-6 font-mono text-sm text-on-surface">{tx.category || '-'}</td>
                        <td className="py-4 px-6 font-body text-sm text-on-surface">{tx.merchant || '-'}</td>
                        <td className="py-4 px-6 font-mono text-sm text-on-surface-variant">
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </td>
                        <td className="py-4 px-6">
                          {anomaly ? (
                            <StatusBadge label={`Flagged — ${(anomaly.score || 0).toFixed(0)}%`} variant="error" />
                          ) : (
                            <StatusBadge label="Clean" variant="success" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t-[3px] border-primary bg-surface-container">
                <span className="font-mono text-xs text-on-surface-variant">
                  Page {page + 1} of {totalPages} &mdash; {filtered.length} total
                </span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 border-[3px] border-primary bg-surface-container-lowest font-mono text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all disabled:opacity-30 disabled:pointer-events-none">
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      const start = Math.max(0, Math.min(page - 3, totalPages - 7))
                      const p = start + i
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-10 h-10 border-[3px] border-primary font-mono text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all ${
                            p === page ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface'
                          }`}>
                          {p + 1}
                        </button>
                      )
                    })}
                  </div>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 border-[3px] border-primary bg-surface-container-lowest font-mono text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all disabled:opacity-30 disabled:pointer-events-none">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon={search ? 'search_off' : 'receipt_long'}
            title={search ? 'No Results' : 'No Transactions'}
            desc={search ? `No transactions match "${search}". Try a different search.` : 'Upload a CSV to populate the ledger archive.'}
            action={search ? { label: 'Clear Search', onClick: () => setSearch('') } : undefined}
          />
        )}
      </div>
    </div>
  )
}
