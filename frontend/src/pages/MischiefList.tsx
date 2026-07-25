import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SeverityBadge from '../components/SeverityBadge'
import { useAnomalies } from '../hooks/useAnomalies'

export default function MischiefList() {
  const navigate = useNavigate()
  const { data: anomalies = [], isLoading } = useAnomalies('default')
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [page, setPage] = useState(0)
  const perPage = 8

  const filtered = anomalies
    .filter((a: any) => severityFilter === 'all' || a.severity === severityFilter)
    .filter((a: any) =>
      search === '' ||
      a.merchant.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    )

  const paged = filtered.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const LOCATION_MAP: Record<string, string> = {
    Food: 'Hogwarts', Shopping: 'Hogsmeade', Bills: 'Gringotts',
    Entertainment: 'Diagon Alley', Travel: 'Platform 9¾',
  }

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">Historical Ledger</h1>
          <p className="font-crimson text-sm text-[#504440] italic">A complete archive of detected mischief.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#735c00] text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-8 pr-4 py-2 bg-transparent border-b-2 border-[#735c00]/30 focus:border-[#735c00] outline-none font-crimson text-sm text-[#2c1810] transition-colors"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(0) }}
            className="px-4 py-2 bg-transparent border-b-2 border-[#735c00]/30 focus:border-[#735c00] outline-none font-crimson text-sm text-[#2c1810] cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="high">Dementor</option>
            <option value="medium">Boggart</option>
            <option value="low">Peeves</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#faf3e6] rounded-xl shadow-md overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#dc2626] to-[#dc2626]/30" />

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-2 border-[#735c00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <span className="material-symbols-outlined text-[48px] text-[#735c00]/30">search_off</span>
              <p className="font-crimson text-sm text-[#504440]">No records found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-[#735c00]/20">
                {['Date', 'Incident', 'Severity', 'Location', 'Impact', 'Action'].map((h) => (
                  <span key={h} className="font-mono text-[10px] text-[#504440] uppercase tracking-wider">{h}</span>
                ))}
              </div>
              {paged.map((a: any, i: number) => (
                <motion.div
                  key={a.anomaly_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-[#735c00]/10 hover:bg-[#f4e0bb]/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/anomaly/${a.anomaly_id}`)}
                >
                  <span className="font-mono text-xs text-[#504440]">
                    {a.detected_at ? new Date(a.detected_at).toLocaleDateString() : 'Jul 25, 2026'}
                  </span>
                  <span className="font-crimson text-sm text-[#2c1810] font-semibold">{a.merchant}</span>
                  <SeverityBadge severity={a.severity} />
                  <span className="font-crimson text-xs text-[#504440] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {LOCATION_MAP[a.category] || a.category}
                  </span>
                  <span className="font-mono text-xs text-[#dc2626]">₹{a.amount.toFixed(0)}</span>
                  <button className="text-[#735c00] hover:text-[#2c1810] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">description</span>
                  </button>
                </motion.div>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="font-mono text-xs text-[#504440]">
              Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length} Records
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="w-8 h-8 rounded-full border border-[#735c00]/30 flex items-center justify-center disabled:opacity-30 hover:bg-[#735c00]/10 transition-colors">
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-full border border-[#735c00]/30 flex items-center justify-center disabled:opacity-30 hover:bg-[#735c00]/10 transition-colors">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
