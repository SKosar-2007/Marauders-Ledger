import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getBatches, getAnomalies, getTransactions, getSpendingByDay, getSpendingByCategory, SEVERITY_CONFIG, type NarrativeSeverity } from '../api/client'
import { MiniSparkline } from '../components/ui'

const CATEGORIES = ['All', 'Food', 'Shopping', 'Bills', 'Transport', 'Entertainment', 'Other']

const CLUSTER_DEFS = [
  { x: 25, y: 35, label: 'Food & Dining', category: 'Food', color: 'bg-surface-container-lowest' },
  { x: 60, y: 20, label: 'Shopping', category: 'Shopping', color: 'bg-tertiary-fixed' },
  { x: 75, y: 55, label: 'Entertainment', category: 'Entertainment', color: 'bg-secondary-container' },
  { x: 40, y: 65, label: 'Bills & Utilities', category: 'Bills', color: 'bg-surface-container-lowest' },
  { x: 15, y: 70, label: 'Transport', category: 'Travel', color: 'bg-surface-container-lowest' },
  { x: 85, y: 75, label: 'Other', category: 'Other', color: 'bg-surface-container-lowest' },
]

const CLUSTER_CONNECTIONS = [
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
  { from: 4, to: 5 }, { from: 5, to: 0 }, { from: 1, to: 3 }, { from: 0, to: 2 },
]

function getSeverity(score?: number): NarrativeSeverity {
  return (score ?? 0) >= 50 ? 'fraud' : 'valid'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null)
  const { data: batches } = useQuery({ queryKey: ['batches'], queryFn: getBatches })
  const { data: anomalies } = useQuery({ queryKey: ['anomalies'], queryFn: () => getAnomalies({ limit: 5 }) })
  const { data: transactions } = useQuery({ queryKey: ['transactions'], queryFn: () => getTransactions({ limit: 100 }) })
  const { data: spendByDay } = useQuery({ queryKey: ['spend-by-day'], queryFn: () => getSpendingByDay(14) })
  const { data: spendByCategory } = useQuery({ queryKey: ['spend-by-category'], queryFn: getSpendingByCategory })

  const chartData = useMemo(() => {
    if (!Array.isArray(spendByDay) || spendByDay.length === 0) return []
    const sorted = [...spendByDay].sort((a: any, b: any) => {
      const da = a.day || a.date || ''
      const db = b.day || b.date || ''
      return da.localeCompare(db)
    })
    const limited = sorted.slice(-14)
    return limited.map((d: any) => ({
      date: d.day || d.date,
      total: d.amount || d.total || 0,
    }))
  }, [spendByDay])

  const categorySpending = useMemo(() => {
    if (!Array.isArray(spendByCategory)) return {}
    const map: Record<string, number> = {}
    for (const item of spendByCategory) {
      map[item.category] = item.total
    }
    return map
  }, [spendByCategory])

  const maxSpending = useMemo(() => {
    const values = Object.values(categorySpending)
    return values.length > 0 ? Math.max(...values, 1) : 1
  }, [categorySpending])

  const categoryAnomalyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (anomalies) {
      for (const a of anomalies) {
        const cat = a.category || 'Other'
        counts[cat] = (counts[cat] || 0) + 1
      }
    }
    return counts
  }, [anomalies])

  const clusters = useMemo(() => {
    return CLUSTER_DEFS.map((def) => {
      const spend = categorySpending[def.category] || 0
      const anomCount = categoryAnomalyCounts[def.category] || 0
      const normalizedSize = spend / maxSpending
      const sizeClass = normalizedSize > 0.5 ? 'lg' : normalizedSize > 0.2 ? 'md' : 'sm'
      return { ...def, spend, anomalies: anomCount, size: sizeClass }
    })
  }, [categorySpending, categoryAnomalyCounts, maxSpending])

  const txnCount = transactions?.length || 0
  const anomalyCount = anomalies?.length || 0
  const batchCount = batches?.length || 0

  const filteredAnomalies = anomalies?.filter((a) => {
    if (selectedCluster === null) return true
    const cluster = clusters[selectedCluster]
    if (!cluster) return false
    return a.category === cluster.category || cluster.label.toLowerCase().includes(a.category?.toLowerCase() || '')
  })

  const handleClusterClick = (idx: number) => {
    setSelectedCluster(selectedCluster === idx ? null : idx)
  }

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <motion.div className="flex items-center justify-between mb-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tighter text-primary">Spending Overview</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-tertiary-fixed animate-pulse border border-primary" />
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">Last synced: {new Date().toLocaleTimeString()}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-8">
          {[
            { label: 'Total TX Volume', icon: 'swap_horiz', value: txnCount.toLocaleString('en-US'), change: '+12.4%', color: 'bg-primary', spark: [30, 45, 38, 52, 48, 65, 70, 55, 80, 72, 85, 90] },
            { label: 'Active Batches', icon: 'hub', value: batchCount.toString(), change: `${batchCount > 0 ? 'Active' : 'None'}`, color: 'bg-tertiary-fixed-dim', spark: [20, 15, 25, 30, 22, 35, 28, 40, 32, 45, 38, 50] },
            { label: 'Critical Anomalies', icon: 'warning', value: anomalyCount.toString().padStart(2, '0'), change: 'Requires attention', color: 'bg-error', urgent: true, spark: [1, 0, 2, 1, 3, 2, 4, 3, 5, 2, 4, 3] },
            { label: 'Avg Transaction', icon: 'receipt', value: txnCount > 0 ? (categorySpending.Food || 0).toFixed(2) : '—', unit: 'G', change: '', color: 'bg-primary', spark: [120, 135, 128, 145, 140, 155, 148, 160, 152, 165, 158, 170] },
          ].map((card, ci) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }}
              className={`bg-surface-container-lowest border-[3px] border-primary p-4 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default ${card.urgent ? 'bg-error-container' : ''}`}>
              <div className={`absolute top-0 left-0 w-full h-2 ${card.color}`} />
              <h3 className="font-mono text-xs uppercase text-on-surface-variant mb-2 mt-2 flex items-center justify-between">
                <span>{card.label}</span>
                <span className="material-symbols-outlined text-[16px]">{card.icon}</span>
              </h3>
              <div className="font-display text-4xl font-bold text-primary tracking-tighter">
                {card.value}{card.unit && <span className="text-2xl">{card.unit}</span>}
              </div>
              {card.change && (
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center justify-center font-mono text-xs px-2 py-0.5 border-[2px] border-primary ${card.urgent ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed'}`}>
                    {card.change}
                  </span>
                </div>
              )}
              {card.spark && <div className="mt-3"><MiniSparkline data={card.spark} color={card.urgent ? 'bg-error' : 'bg-tertiary-fixed'} height={8} /></div>}
              {card.label === 'Critical Anomalies' && anomalyCount > 0 && (
                <button onClick={() => navigate('/anomalies')}
                  className="mt-3 w-full bg-primary text-on-primary font-mono text-xs uppercase py-2 border-[2px] border-primary shadow-[4px_4px_0px_0px_rgba(186,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  Investigate
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-surface-container-lowest border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6 overflow-hidden">
          <div className="bg-primary px-4 py-2 border-b-[3px] border-primary flex justify-between items-center">
            <h2 className="font-display text-lg font-bold text-on-primary tracking-tight uppercase">Spending Trend (14 days)</h2>
            <span className="font-mono text-[10px] text-on-primary/70 uppercase">G</span>
          </div>
          <div className="p-4 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00fbfb" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00fbfb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e2e2" strokeDasharray="4 4" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke="#7e7576" tickFormatter={(d) => d?.slice(5) || ''} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke="#7e7576" />
                  <Tooltip contentStyle={{ border: '3px solid #000', borderRadius: 0, boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)', fontSize: 12, fontFamily: 'JetBrains Mono' }} />
                  <Area type="monotone" dataKey="total" stroke="#00fbfb" strokeWidth={2} fill="url(#spendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant font-mono text-xs uppercase">No trend data available</div>
            )}
          </div>
        </motion.div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => { setActiveFilter(cat); setSelectedCluster(null) }}
              className={`font-mono text-xs uppercase px-4 py-2 border-[3px] border-primary transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none ${
                activeFilter === cat ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-secondary-fixed hover:text-on-secondary-fixed'
              }`}>
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}
          {selectedCluster !== null && (
            <button onClick={() => setSelectedCluster(null)}
              className="font-mono text-xs uppercase px-4 py-2 border-[3px] border-primary bg-error text-on-error shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all ml-auto">
              Clear Selection
            </button>
          )}
        </div>

        <motion.div className="flex flex-col lg:flex-row gap-gutter min-h-[600px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex-1 bg-inverse-surface border-[3px] border-primary shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative flex flex-col overflow-hidden group">
            <div className="bg-primary text-on-primary px-4 py-2 border-b-[3px] border-primary flex justify-between items-center z-10 shrink-0">
              <span className="font-display text-lg font-bold tracking-tight uppercase">Spending Cluster Map</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-tertiary-fixed animate-pulse border border-primary" />
                <span className="font-mono text-[10px] uppercase text-on-primary/70">Click clusters to filter</span>
              </div>
            </div>
            <div className="flex-1 relative bg-[#1e2020] overflow-hidden">
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {CLUSTER_CONNECTIONS.map((p, i) => {
                  const f = clusters[p.from]
                  const t = clusters[p.to]
                  return (
                    <path key={i} d={`M${f.x},${f.y} L${t.x},${t.y}`}
                      fill="none" stroke="#3a3c3c" strokeWidth="1" strokeDasharray="4 4" opacity="0.4">
                      <animate attributeName="stroke-dashoffset" dur={`${2 + i * 0.3}s`} from="16" repeatCount="indefinite" to="0" />
                    </path>
                  )
                })}
                <g>
                  {clusters.map((c, i) => (
                    <circle key={`anom-${i}`} cx={c.x} cy={c.y} r={c.anomalies > 0 ? 12 : 0}
                      fill="none" stroke="#ba1a1a" strokeWidth="2" opacity={0.6}>
                      {c.anomalies > 0 && <animate attributeName="r" dur="1.5s" from="12" repeatCount="indefinite" to="18" />}
                      {c.anomalies > 0 && <animate attributeName="opacity" dur="1.5s" from="0.6" repeatCount="indefinite" to="0" />}
                    </circle>
                  ))}
                </g>
              </svg>
              {clusters.map((c, i) => {
                const visible = activeFilter === 'All' || c.label.toLowerCase().includes(activeFilter.toLowerCase())
                if (!visible) return null
                const isSelected = selectedCluster === i
                return (
                  <div key={i} onClick={() => handleClusterClick(i)}
                    className="absolute flex flex-col items-center group cursor-pointer z-10"
                    style={{ top: `${c.y}%`, left: `${c.x}%`, transform: 'translate(-50%, -50%)' }}>
                    {c.anomalies > 0 && <div className="absolute w-10 h-10 bg-error animate-ping opacity-20" style={{ borderRadius: '50%' }} />}
                    <div className={`${c.size === 'lg' ? 'w-14 h-14' : c.size === 'md' ? 'w-11 h-11' : 'w-9 h-9'} ${c.color} border-[3px] border-primary relative z-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center ${c.anomalies > 0 ? 'animate-pulse' : ''} ${isSelected ? 'ring-4 ring-secondary-container scale-110' : ''} hover:scale-110 transition-all`}
                      style={{ borderRadius: c.size === 'lg' ? '4px' : '50%' }}>
                      {c.anomalies > 0 ? (
                        <span className="material-symbols-outlined text-sm text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm text-primary">circle</span>
                      )}
                    </div>
                    <div className={`${isSelected ? 'bg-secondary-container text-on-secondary-container shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : 'bg-primary text-on-primary'} font-mono text-[10px] px-2 py-1 mt-2 border-2 border-primary whitespace-nowrap absolute top-full transition-all z-20`}>
                      {c.label}
                      <span className="ml-1 text-tertiary-fixed">{c.spend.toFixed(0)}G</span>
                      {c.anomalies > 0 && <span className="ml-1 text-error">({c.anomalies})</span>}
                    </div>
                  </div>
                )
              })}
              <div className="absolute bottom-4 right-4 bg-surface border-[3px] border-primary p-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 z-40">
                <span className="font-mono text-[10px] uppercase text-on-surface font-bold">Legend</span>
                {[
                  { color: 'bg-surface-container-lowest', label: 'Normal Cluster' },
                  { color: 'bg-tertiary-fixed', label: 'High Traffic' },
                  { color: 'bg-error', label: 'Anomalies Present', pulse: true },
                  { color: 'bg-secondary-container', label: 'Selected', ring: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 ${item.color} border-2 border-primary ${item.pulse ? 'animate-pulse' : ''} ${item.ring ? 'ring-2 ring-secondary-container' : ''}`} />
                    <span className="font-mono text-xs text-on-surface">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96 bg-surface-container border-[3px] border-primary shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[600px] shrink-0">
            <div className="bg-primary text-on-primary px-4 py-2 border-b-[3px] border-primary shrink-0 flex justify-between items-center">
              <span className="font-display text-lg font-bold tracking-tight uppercase">
                {selectedCluster !== null ? `${clusters[selectedCluster].label}` : 'Anomaly Feed'}
              </span>
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-error animate-pulse" />
                <span className="font-mono text-[10px] uppercase text-on-primary/70">{filteredAnomalies?.length || 0} alerts</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-surface-bright p-3 space-y-2">
              {filteredAnomalies && filteredAnomalies.length > 0 ? filteredAnomalies.map((a) => {
                const sev = getSeverity(a.score)
                const cfg = SEVERITY_CONFIG[sev]
                return (
                  <motion.div key={a.anomaly_id} onClick={() => navigate(`/anomaly/${a.anomaly_id}`)}
                    className="border-[3px] border-primary bg-surface-container-lowest p-3 cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`material-symbols-outlined text-sm ${cfg.color} group-hover:scale-110 transition-transform`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-primary truncate">{a.merchant || 'Unknown'}</span>
                          <span className={`font-mono text-[10px] uppercase px-1.5 py-0.5 border-[2px] border-primary ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <p className="font-mono text-[11px] text-on-surface-variant mt-0.5">{a.category} &mdash; {a.amount?.toFixed(2)} G</p>
                      </div>
                    </div>
                    {Array.isArray(a.triggered_rules) && a.triggered_rules.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {a.triggered_rules.slice(0, 2).map((r, j) => (
                          <span key={j} className="font-mono text-[9px] uppercase border-[1px] border-primary px-1 bg-surface-container">{r}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 font-mono text-[9px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-[10px]">schedule</span>
                      {a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : 'N/A'}
                      <span className="ml-auto">Score: {a.score?.toFixed(0) || '?'}%</span>
                    </div>
                  </motion.div>
                )
              }) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-16 h-16 border-[3px] border-primary bg-surface-container flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-4">
                    <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <p className="font-mono text-sm text-on-surface-variant uppercase">No anomalies detected</p>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-1">
                    {selectedCluster !== null ? 'This cluster is clean' : 'Upload a CSV to begin scanning'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
