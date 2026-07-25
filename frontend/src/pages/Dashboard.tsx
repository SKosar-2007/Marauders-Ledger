import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import MaraudersMap from '../components/MaraudersMap'
import AnomalyCard from '../components/AnomalyCard'
import FilterTabs from '../components/FilterTabs'
import SpendChart from '../components/SpendChart'
import { useAnomalies } from '../hooks/useAnomalies'

const MOCK_CHART_DATA = [
  { day: 'Mon', amount: 450 }, { day: 'Tue', amount: 320 },
  { day: 'Wed', amount: 680, hasAnomaly: true }, { day: 'Thu', amount: 210 },
  { day: 'Fri', amount: 890, hasAnomaly: true }, { day: 'Sat', amount: 540 },
  { day: 'Sun', amount: 1200, hasAnomaly: true },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const { data: anomalies = [], isLoading } = useAnomalies('default')

  const filtered = activeTab === 'all' ? anomalies : anomalies.filter((a: any) => a.category === activeTab)

  const stats = {
    total: anomalies.length,
    high: anomalies.filter((a: any) => a.severity === 'high').length,
    medium: anomalies.filter((a: any) => a.severity === 'medium').length,
    low: anomalies.filter((a: any) => a.severity === 'low').length,
    totalImpact: anomalies.reduce((sum: number, a: any) => sum + a.amount, 0),
  }

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1400px] mx-auto">
        {/* Stats Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 py-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#faf3e6] rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-[#735c00]">bug_report</span>
            <span className="font-mono text-xs text-[#504440]">{stats.total} anomalies</span>
          </div>
          {stats.high > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#dc2626]/5 rounded-lg shadow-sm">
              <span className="w-2 h-2 bg-[#dc2626] rounded-full animate-pulse" />
              <span className="font-mono text-xs text-[#dc2626]">{stats.high} high</span>
            </div>
          )}
          {stats.medium > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#d4af37]/5 rounded-lg shadow-sm">
              <span className="w-2 h-2 bg-[#d4af37] rounded-full" />
              <span className="font-mono text-xs text-[#d4af37]">{stats.medium} medium</span>
            </div>
          )}
          {stats.low > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2d6a4f]/5 rounded-lg shadow-sm">
              <span className="w-2 h-2 bg-[#2d6a4f] rounded-full" />
              <span className="font-mono text-xs text-[#2d6a4f]">{stats.low} low</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#faf3e6] rounded-lg shadow-sm ml-auto">
            <span className="material-symbols-outlined text-[14px] text-[#735c00]">payments</span>
            <span className="font-mono text-xs text-[#504440]">₹{stats.totalImpact.toLocaleString()} impact</span>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
          {/* Map */}
          <div className="flex-grow lg:w-3/5 h-full relative rounded-xl overflow-hidden shadow-xl bg-[#faf3e6] parchment-edge">
            <MaraudersMap anomalies={filtered} onSelectAnomaly={(id) => navigate(`/anomaly/${id}`)} />
          </div>

          {/* Sidebar */}
          <div className="flex-grow lg:w-2/5 h-full flex flex-col bg-[#fff8f2] rounded-xl shadow-md overflow-hidden relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#dc2626]/30 z-0 pointer-events-none" />
            <div className="p-6 relative z-10 flex-shrink-0 bg-[#fff8f2]/95 backdrop-blur-sm shadow-sm border-b border-[#d3c3be]/30">
              <h2 className="font-cinzel text-lg text-[#2c1810] mb-1">Detected Mischief</h2>
              <p className="font-crimson text-xs text-[#504440]">Real-time ledger anomalies.</p>
              <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <div className="flex-grow overflow-y-auto p-6 pl-12 space-y-6 relative z-10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 border-2 border-[#735c00] border-t-transparent rounded-full animate-spin" />
                  <p className="font-crimson text-sm text-[#504440] italic">The map is revealing mischief...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#f4e0bb] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-[#735c00]">search_off</span>
                  </div>
                  <p className="font-cinzel text-sm text-[#2c1810]">No mischief detected</p>
                  <p className="font-crimson text-xs text-[#504440]">Upload a parchment to begin the investigation.</p>
                </div>
              ) : (
                filtered.map((a: any, i: number) => <AnomalyCard key={a.anomaly_id} anomaly={a} index={i} />)
              )}
            </div>
            <SpendChart data={MOCK_CHART_DATA} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
