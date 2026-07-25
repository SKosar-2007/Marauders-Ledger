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

export default function AnomalyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: anomalies = [] } = useAnomalies('default')
  const { data: narrative, isLoading: narrativeLoading } = useNarrative(id || '')
  const { data: audioBlob, isLoading: audioLoading } = useAudio(id || '')

  const anomaly = anomalies.find((a: any) => a.anomaly_id === id)

  if (!anomaly) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="w-full pt-20 px-4 lg:px-10 max-w-[1200px] mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-16 h-16 rounded-full bg-[#f4e0bb] flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-[#735c00]">search_off</span>
            </div>
            <p className="font-cinzel text-sm text-[#2c1810]">Anomaly not found</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="font-crimson text-sm text-[#735c00] hover:text-[#2c1810] underline decoration-[#735c00]/50 underline-offset-4"
            >
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
    <div className="min-h-screen">
      <Header />
      <main className="w-full pt-20 px-4 lg:px-10 max-w-[1200px] mx-auto">
        <div className="flex flex-col w-full">
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-[#f4e0bb] rounded-xl p-8 mb-6 parchment-edge shadow-md"
          >
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-[#735c00]/20 pointer-events-none" />
            <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-[#dc2626]/40 pointer-events-none hidden md:block" />

            <div className="md:pl-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
                <div>
                  <span className="font-crimson text-xs text-[#504440] uppercase tracking-widest block mb-2">
                    Merchant Identity
                  </span>
                  <h1 className="font-cinzel text-2xl md:text-3xl text-[#2c1810]">{anomaly.merchant}</h1>
                  <p className="font-crimson text-sm text-[#504440] mt-1">{anomaly.category} Transaction</p>
                </div>
                <div className="mt-4 md:mt-0 text-left md:text-right">
                  <span className="font-crimson text-xs text-[#504440] uppercase tracking-widest block mb-2">
                    Transacted Value
                  </span>
                  <div className="font-crimson text-xl text-[#735c00]">₹{anomaly.amount.toFixed(2)}</div>
                  <p className="font-crimson text-xs text-[#504440] mt-1">
                    {anomaly.hour}:00 — {anomaly.category}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-8 items-center">
                <SeverityBadge severity={anomaly.severity} />
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-[#735c00] text-white hover:bg-[#5a4a00] transition-all px-6 py-2 rounded-full flex items-center gap-2 text-sm font-crimson"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Return to Map
                </button>
              </div>
            </div>
          </motion.div>

          {/* Score Gauges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
          >
            <ScoreGauge
              score={anomaly.isolation_score}
              label="Arcane ML Model"
              color={anomaly.isolation_score > 0.6 ? '#dc2626' : '#735c00'}
            />
            <ScoreGauge
              score={anomaly.rule_score}
              label="Ministry Ruleset"
              color={anomaly.rule_score > 0.5 ? '#d4af37' : '#735c00'}
            />
            <ScoreGauge
              score={anomaly.final_score}
              label="Final Mischief Score"
              color={anomaly.severity === 'high' ? '#dc2626' : anomaly.severity === 'medium' ? '#d4af37' : '#2d6a4f'}
            />
          </motion.div>

          {/* Narrative + Audio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 mb-6"
          >
            <NarrativeCard
              text={narrative?.text || ''}
              isLoading={narrativeLoading}
            />
            <AudioPlayer
              audioUrl={audioUrl}
              isLoading={audioLoading}
            />
          </motion.div>

          {/* Triggered Rules */}
          {anomaly.triggered_rules.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-6"
            >
              <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">
                Triggered Rules
              </h3>
              <div className="flex flex-wrap gap-2">
                {anomaly.triggered_rules.map((rule: string) => (
                  <span
                    key={rule}
                    className="px-3 py-1 bg-[#dc2626]/10 text-[#dc2626] rounded-full font-crimson text-xs"
                  >
                    {rule.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
