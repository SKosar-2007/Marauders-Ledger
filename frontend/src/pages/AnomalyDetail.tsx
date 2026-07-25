import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScoreGauge from '../components/ScoreGauge'
import NarrativeCard from '../components/NarrativeCard'
import AudioPlayer from '../components/AudioPlayer'
import SeverityBadge from '../components/SeverityBadge'
import { useAnomalies } from '../hooks/useAnomalies'
import { useNarrative } from '../hooks/useNarrative'
import { useAudio } from '../hooks/useAudio'

const TETHERED_TXNS = [
  { date: 'Oct 31, 1981', entity: 'Ollivanders', amount: 450, status: 'cleared' },
  { date: 'Oct 31, 1981', entity: 'Flourish and Blotts', amount: 320, status: 'investigating' },
  { date: 'Oct 31, 1981', entity: 'Unknown Gringotts Vault', amount: 680, status: 'investigating' },
]

export default function AnomalyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: anomalies = [] } = useAnomalies('default')
  const { data: narrative, isLoading: narrativeLoading } = useNarrative(id || '')
  const { data: audioBlob, isLoading: audioLoading, isError: audioError } = useAudio(id || '')

  const anomaly = anomalies.find((a: any) => String(a.anomaly_id) === id)

  if (!anomaly) {
    return (
      <div className="min-h-screen ml-[72px]">
        <Header />
        <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <span className="material-symbols-outlined text-[48px] text-[#735c00]/30">search_off</span>
            <p className="font-cinzel text-sm text-[#2c1810]">Anomaly not found</p>
            <button onClick={() => navigate('/dashboard')} className="font-crimson text-sm text-[#735c00] hover:text-[#2c1810] underline decoration-[#735c00]/50 underline-offset-4">
              Return to Map
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : ''

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        {/* Header Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#f4e0bb] rounded-xl p-8 mb-6 parchment-edge shadow-md mt-8">
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-[#735c00]/20 pointer-events-none" />
          <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-[#dc2626]/40 pointer-events-none hidden md:block" />
          <div className="md:pl-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
              <div>
                <span className="font-crimson text-xs text-[#504440] uppercase tracking-widest block mb-2">Merchant Identity</span>
                <h1 className="font-cinzel text-2xl md:text-3xl text-[#2c1810]">{anomaly.merchant}</h1>
                <p className="font-crimson text-sm text-[#504440] mt-1">{anomaly.category} Transaction</p>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <span className="font-crimson text-xs text-[#504440] uppercase tracking-widest block mb-2">Transacted Value</span>
                <div className="font-mono text-xl text-[#735c00]">₹{anomaly.amount.toFixed(2)}</div>
                <p className="font-crimson text-xs text-[#504440] mt-1">{anomaly.hour}:00 — {anomaly.category}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-8 items-center">
              <SeverityBadge severity={anomaly.severity} />
              <button className="bg-[#735c00] text-white hover:bg-[#5a4a00] transition-all px-6 py-2 rounded-full flex items-center gap-2 text-sm font-crimson relative overflow-hidden group">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Mark Valid
              </button>
              <button className="bg-transparent text-[#735c00] ring-1 ring-[#735c00] hover:bg-[#735c00]/10 transition-colors px-6 py-2 rounded-full flex items-center gap-2 text-sm font-crimson">
                <span className="material-symbols-outlined text-[18px]">block</span>
                Confirm Mischief
              </button>
              <button onClick={() => navigate('/dashboard')} className="ml-auto font-crimson text-sm text-[#735c00] hover:text-[#2c1810] underline decoration-[#735c00]/50 underline-offset-4">
                ← Return to Map
              </button>
            </div>
          </div>
        </motion.div>

        {/* Score Gauges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <ScoreGauge score={anomaly.isolation_score} label="Arcane ML Model" color={anomaly.isolation_score > 0.6 ? '#dc2626' : '#735c00'}
            description={`${Math.round(anomaly.isolation_score * 100)}% probability of dark artifacts`} />
          <ScoreGauge score={anomaly.rule_score} label="Ministry Ruleset" color={anomaly.rule_score > 0.5 ? '#d4af37' : '#735c00'}
            description={`${Math.round(anomaly.rule_score * 100)}% flags on recent activity`} />
          <ScoreGauge score={anomaly.final_score} label="Final Mischief Score"
            color={anomaly.severity === 'high' ? '#dc2626' : anomaly.severity === 'medium' ? '#d4af37' : '#2d6a4f'}
            description={anomaly.severity === 'high' ? 'Requires Immediate Attention' : 'Under Investigation'} />
        </motion.div>

        {/* Narrative + Audio */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="space-y-4 mb-6">
          <NarrativeCard text={narrative?.text || ''} isLoading={narrativeLoading} />
          <AudioPlayer audioUrl={audioUrl} isLoading={audioLoading} error={audioError} />
        </motion.div>

        {/* Triggered Rules */}
        {anomaly.triggered_rules.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-6">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Triggered Rules</h3>
            <div className="flex flex-wrap gap-2">
              {anomaly.triggered_rules.map((rule: string) => (
                <span key={rule} className="px-3 py-1 bg-[#dc2626]/10 text-[#dc2626] rounded-full font-crimson text-xs">
                  {rule.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tethered Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Tethered Transactions</h3>
          <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-4 py-2 border-b border-[#735c00]/20">
            {['Date', 'Entity', 'Amount', 'Status'].map((h) => (
              <span key={h} className="font-mono text-[10px] text-[#504440] uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {TETHERED_TXNS.map((txn, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-4 py-3 border-b border-[#735c00]/10 hover:bg-[#f4e0bb]/30 transition-colors">
              <span className="font-mono text-xs text-[#504440]">{txn.date}</span>
              <span className="font-crimson text-sm text-[#2c1810]">{txn.entity}</span>
              <span className="font-mono text-xs text-[#dc2626]">₹{txn.amount}</span>
              <span className={`font-crimson text-xs px-2 py-1 rounded-full w-fit ${
                txn.status === 'cleared' ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]' : 'bg-[#dc2626]/10 text-[#dc2626]'
              }`}>
                {txn.status}
              </span>
            </div>
          ))}
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
