import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAnomalies } from '../hooks/useAnomalies'
import { useSpendingByDay } from '../hooks/useSpending'

export default function DuelingArena() {
  const { data: anomalies = [] } = useAnomalies()
  const { data: spendingData = [] } = useSpendingByDay()

  const totalSpent = spendingData.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Dueling Arena</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Performance benchmarking — where spells are tested</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md text-center">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Total Anomalies</h3>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#735c0020" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#2d6a4f" strokeWidth="3"
                  strokeDasharray={`${Math.min(anomalies.length * 5, 94)} 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-cinzel text-2xl text-[#2c1810]">{anomalies.length}</span>
                <span className="font-crimson text-[10px] text-[#504440]">total</span>
              </span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md text-center">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Total Spent</h3>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#735c0020" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#735c00" strokeWidth="3"
                  strokeDasharray={`${Math.min(totalSpent / 100, 94)} 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-cinzel text-2xl text-[#2c1810]">₹{totalSpent.toLocaleString()}</span>
                <span className="font-crimson text-[10px] text-[#504440]">spent</span>
              </span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Shield Strength</h3>
            <div className="space-y-4">
              {[
                { name: 'Rate Limiting', strength: 95 },
                { name: 'Input Validation', strength: 88 },
                { name: 'Auth Shield', strength: 92 },
                { name: 'SQL Injection Ward', strength: 78 },
              ].map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-crimson text-sm text-[#2c1810]">{s.name}</span>
                    <span className="font-mono text-xs text-[#504440]">{s.strength}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#735c00]/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.strength}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                      className={`h-full rounded-full ${s.strength > 90 ? 'bg-[#2d6a4f]' : s.strength > 80 ? 'bg-[#735c00]' : 'bg-[#d4af37]'}`} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Active Jinxes</h3>
            <div className="space-y-3">
              {[
                { name: 'Real-time Anomaly Stream', rps: anomalies.length * 120, status: 'active' },
                { name: 'Narrative Generation Queue', rps: 45, status: 'active' },
                { name: 'TTS Audio Pipeline', rps: 12, status: 'active' },
              ].map((j, i) => (
                <div key={i} className="p-3 bg-white/50 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-crimson text-sm text-[#2c1810]">{j.name}</h4>
                    <span className="font-mono text-[10px] text-[#504440]">{j.rps} req/sec</span>
                  </div>
                  <div className="w-2 h-2 bg-[#2d6a4f] rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-8 bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Anomaly History</h3>
          <div className="space-y-2">
            {anomalies.length === 0 ? (
              <p className="font-crimson text-sm text-[#504440] text-center py-4">No anomaly history yet.</p>
            ) : (
              anomalies.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/50 rounded-lg font-mono text-xs">
                  <span className={`material-symbols-outlined text-[14px] ${a.severity === 'high' ? 'text-[#dc2626]' : a.severity === 'medium' ? 'text-[#d4af37]' : 'text-[#2d6a4f]'}`}>
                    {a.severity === 'high' ? 'warning' : a.severity === 'medium' ? 'info' : 'check_circle'}
                  </span>
                  <span className="flex-1 text-[#2c1810] truncate">{a.merchant} — ₹{a.amount.toFixed(0)}</span>
                  <span className="text-[#504440]">{a.severity}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
