import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAnomalies } from '../hooks/useAnomalies'
import { useSpendingByCategory } from '../hooks/useSpending'

export default function RoomOfWorkspace() {
  const navigate = useNavigate()
  const { data: anomalies = [] } = useAnomalies()
  const { data: categoryData = [] } = useSpendingByCategory()

  const totalSpent = categoryData.reduce((s, c) => s + c.total, 0)
  const highCount = anomalies.filter((a) => a.severity === 'high').length

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Room of Requirement</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Your personalized workspace — it appears when you need it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Active Tracking</h3>
            <div className="relative h-40 bg-[#2c1810]/5 rounded-lg overflow-hidden">
              <svg viewBox="0 0 200 120" className="w-full h-full">
                <path d="M20,100 Q50,20 100,60 T180,30" fill="none" stroke="#735c00" strokeWidth="2" strokeDasharray="4,4" />
                {anomalies.slice(0, 5).map((a, i) => {
                  const x = 20 + (i * 35)
                  const y = 100 - (a.final_score * 80)
                  return (
                    <g key={a.anomaly_id}>
                      <circle cx={x} cy={y} r="4" fill="#735c00" opacity={0.3 + i * 0.15} />
                      <circle cx={x} cy={y} r="2" fill="#735c00" />
                    </g>
                  )
                })}
                {anomalies.length === 0 && (
                  <>
                    <circle cx="40" cy="85" r="4" fill="#735c00" opacity="0.3" />
                    <circle cx="70" cy="50" r="4" fill="#735c00" opacity="0.45" />
                    <circle cx="100" cy="60" r="4" fill="#735c00" opacity="0.6" />
                  </>
                )}
              </svg>
            </div>
            <p className="font-crimson text-xs text-[#504440] mt-2 italic">{anomalies.length} anomalies tracked across {categoryData.length} locations</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Vault Summary</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#735c0020" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#d4af37" strokeWidth="3"
                    strokeDasharray={`${Math.min(totalSpent / 500, 94)} 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-[#2c1810]">
                  {totalSpent > 0 ? '✓' : '—'}
                </span>
              </div>
              <div>
                <div className="font-cinzel text-2xl text-[#735c00]">₹{totalSpent.toLocaleString()}</div>
                <p className="font-crimson text-xs text-[#504440]">Total Spent</p>
                <p className="font-crimson text-xs text-[#2d6a4f]">{categoryData.length} categories</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Recent Intercepts</h3>
            <div className="space-y-3">
              {anomalies.slice(0, 3).map((a) => (
                <div key={a.anomaly_id} onClick={() => navigate(`/anomaly/${a.anomaly_id}`)}
                  className="p-3 bg-white/50 rounded-lg flex items-start gap-3 cursor-pointer hover:bg-[#f4e0bb]/50 transition-colors">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    a.severity === 'high' ? 'bg-[#dc2626]' : a.severity === 'medium' ? 'bg-[#d4af37]' : 'bg-[#2d6a4f]'
                  }`} />
                  <div className="flex-1">
                    <p className="font-crimson text-sm text-[#2c1810]">{a.merchant} — ₹{a.amount.toFixed(0)}</p>
                    <div className="flex justify-between mt-1">
                      <span className="font-crimson text-xs text-[#504440]">{a.category}</span>
                      <span className="font-mono text-[10px] text-[#504440]">{a.severity}</span>
                    </div>
                  </div>
                </div>
              ))}
              {anomalies.length === 0 && (
                <p className="font-crimson text-sm text-[#504440] text-center py-4">No intercepts yet.</p>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Active Jinxes</h3>
            <div className="space-y-3">
              {[
                { name: 'Amount Spike Detection', progress: 85, active: highCount > 0 },
                { name: 'Unusual Hour Monitor', progress: 72, active: anomalies.some((a) => a.hour < 6 || a.hour > 22) },
                { name: 'New Merchant Alert', progress: 45, active: categoryData.length > 3 },
              ].map((j, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-crimson text-sm text-[#2c1810]">{j.name}</span>
                    <span className={`w-2 h-2 rounded-full ${j.active ? 'bg-[#2d6a4f] animate-pulse' : 'bg-[#504440]/30'}`} />
                  </div>
                  <div className="w-full h-1.5 bg-[#735c00]/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${j.progress}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                      className="h-full bg-[#735c00] rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
