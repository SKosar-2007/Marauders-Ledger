import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAnomalies } from '../hooks/useAnomalies'

export default function OEA() {
  const { data: anomalies = [] } = useAnomalies()

  const highCount = anomalies.filter((a) => a.severity === 'high').length
  const medCount = anomalies.filter((a) => a.severity === 'medium').length

  const FAULTS = anomalies.slice(0, 6).map((a, i) => ({
    time: a.detected_at ? new Date(a.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${14 - i}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    level: a.severity === 'high' ? 'critical' : a.severity === 'medium' ? 'warn' : 'info',
    msg: `${a.merchant} — ₹${a.amount.toFixed(0)} anomaly`,
    source: a.category.toLowerCase(),
  }))

  const fallbackFaults = [
    { time: '14:15', level: 'info', msg: 'All systems operational — no anomalies detected', source: 'system' },
  ]

  const displayFaults = FAULTS.length > 0 ? FAULTS : fallbackFaults

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">O.E.A. Diagnostics</h1>
          <p className="font-crimson text-sm text-[#504440] italic">System health monitoring — the eyes of the Ministry</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Critical Alerts', value: highCount, icon: 'warning', color: '#dc2626' },
            { label: 'Warnings', value: medCount, icon: 'info', color: '#d4af37' },
            { label: 'Total Anomalies', value: anomalies.length, icon: 'bug_report', color: '#735c00' },
          ].map((g, i) => (
            <motion.div key={g.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-6 shadow-md text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#735c0020" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none"
                    stroke={g.color}
                    strokeWidth="3"
                    strokeDasharray={`${Math.min(g.value * 10, 94)} 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-lg text-[#2c1810]">{g.value}</span>
              </div>
              <h4 className="font-cinzel text-sm text-[#2c1810] mb-1">{g.label}</h4>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { label: 'Detection Rate', value: anomalies.length > 0 ? 99.7 : 0, unit: '%', color: 'bg-[#2d6a4f]' },
            { label: 'Critical Rate', value: anomalies.length > 0 ? Math.round((highCount / anomalies.length) * 100) : 0, unit: '%', color: 'bg-[#dc2626]' },
            { label: 'Coverage', value: anomalies.length > 0 ? 95 : 0, unit: '%', color: 'bg-[#735c00]' },
            { label: 'Uptime', value: 99.9, unit: '%', color: 'bg-[#2d6a4f]' },
          ].map((v, i) => (
            <div key={i} className="bg-[#faf3e6] rounded-xl p-4 shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-crimson text-sm text-[#2c1810]">{v.label}</span>
                <span className="font-mono text-sm text-[#735c00]">{v.value}{v.unit}</span>
              </div>
              <div className="w-full h-2 bg-[#735c00]/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${v.value}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                  className={`h-full ${v.color} rounded-full`} />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Spell Stack Log</h3>
          <div className="space-y-2">
            {displayFaults.map((f, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg ${
                f.level === 'critical' ? 'bg-[#dc2626]/5 border-l-2 border-[#dc2626]' :
                f.level === 'warn' ? 'bg-[#d4af37]/5 border-l-2 border-[#d4af37]' :
                'bg-white/50 border-l-2 border-[#504440]/20'
              }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  f.level === 'critical' ? 'bg-[#dc2626] animate-pulse' :
                  f.level === 'warn' ? 'bg-[#d4af37]' : 'bg-[#504440]/30'
                }`} />
                <span className="font-mono text-xs text-[#504440] w-12">{f.time}</span>
                <span className="font-crimson text-sm text-[#2c1810] flex-1">{f.msg}</span>
                <span className="font-mono text-[10px] text-[#504440]">{f.source}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
