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
  { day: 'Mon', amount: 450, hasAnomaly: false },
  { day: 'Tue', amount: 320, hasAnomaly: false },
  { day: 'Wed', amount: 680, hasAnomaly: true },
  { day: 'Thu', amount: 210, hasAnomaly: false },
  { day: 'Fri', amount: 890, hasAnomaly: true },
  { day: 'Sat', amount: 540, hasAnomaly: false },
  { day: 'Sun', amount: 1200, hasAnomaly: true },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const { data: anomalies = [], isLoading } = useAnomalies('default')

  const filteredAnomalies = activeTab === 'all'
    ? anomalies
    : anomalies.filter((a: any) => a.category === activeTab)

  const handleSelectAnomaly = (id: string) => {
    navigate(`/anomaly/${id}`)
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="w-full pt-20 px-4 lg:px-10 max-w-[1200px] mx-auto">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-6">
          {/* Left Panel: Marauder's Map */}
          <div className="flex-grow lg:w-3/5 h-full relative rounded-xl overflow-hidden shadow-xl bg-[#faf3e6] parchment-edge">
            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 100px rgba(115, 92, 0, 0.2), inset 0 0 20px rgba(44, 24, 16, 0.1)' }} />
            <div className="absolute inset-2 border border-[#735c00]/20 pointer-events-none rounded-lg" />

            <MaraudersMap
              anomalies={filteredAnomalies}
              onSelectAnomaly={handleSelectAnomaly}
            />

            {/* Mischief Managed button */}
            <button
              className="absolute top-8 right-8 z-20 px-6 py-2 bg-[#f5e6c8] border-2 border-[#d4af37] rounded shadow-md text-[#735c00] font-crimson uppercase tracking-widest transition-all duration-500 hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95"
              onClick={() => {
                // Reset / clear map
                window.location.reload()
              }}
            >
              Mischief Managed
            </button>
          </div>

          {/* Right Panel: Anomaly Sidebar */}
          <div className="flex-grow lg:w-2/5 h-full flex flex-col bg-[#fff8f2] rounded-xl shadow-md overflow-hidden relative">
            {/* Red margin line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#dc2626]/30 z-0 pointer-events-none" />

            {/* Header + Tabs */}
            <div className="p-6 relative z-10 flex-shrink-0 bg-[#fff8f2]/95 backdrop-blur-sm shadow-sm border-b border-[#d3c3be]/30">
              <h2 className="font-cinzel text-lg text-[#2c1810] mb-1">Detected Mischief</h2>
              <p className="font-crimson text-xs text-[#504440]">Real-time ledger anomalies.</p>
              <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Anomaly list */}
            <div className="flex-grow overflow-y-auto p-6 pl-12 space-y-6 relative z-10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <motion.div
                    className="w-12 h-12 border-2 border-[#735c00] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                  <p className="font-crimson text-sm text-[#504440] italic">The map is revealing mischief...</p>
                </div>
              ) : filteredAnomalies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#f4e0bb] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-[#735c00]">search_off</span>
                  </div>
                  <p className="font-cinzel text-sm text-[#2c1810]">No mischief detected</p>
                  <p className="font-crimson text-xs text-[#504440]">Upload a parchment to begin the investigation.</p>
                </div>
              ) : (
                filteredAnomalies.map((anomaly: any, index: number) => (
                  <AnomalyCard
                    key={anomaly.anomaly_id}
                    anomaly={anomaly}
                    index={index}
                  />
                ))
              )}
            </div>

            {/* Spend chart */}
            <SpendChart data={MOCK_CHART_DATA} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
