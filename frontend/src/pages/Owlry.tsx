import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAnomalies } from '../hooks/useAnomalies'
import { useSpendingByCategory } from '../hooks/useSpending'

export default function Owlry() {
  const { data: anomalies = [] } = useAnomalies()
  const { data: categoryData = [] } = useSpendingByCategory()

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Owlry</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Messenger fleet management — every owl accounted for</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Anomalies', value: String(anomalies.length), icon: 'pets' },
            { label: 'High Severity', value: String(anomalies.filter((a) => a.severity === 'high').length), icon: 'flight' },
            { label: 'Categories', value: String(categoryData.length), icon: 'mail' },
            { label: 'Total Spent', value: `₹${categoryData.reduce((s, c) => s + c.total, 0).toLocaleString()}`, icon: 'speed' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-5 shadow-md text-center">
              <span className="material-symbols-outlined text-[24px] text-[#735c00] mb-2 block">{s.icon}</span>
              <div className="font-mono text-xs text-[#504440] mb-1">{s.label}</div>
              <div className="font-cinzel text-xl text-[#2c1810]">{s.value}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-8">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Active Anomalies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-8 gap-2">
                <span className="material-symbols-outlined text-[32px] text-[#735c00]/30">pets</span>
                <p className="font-crimson text-sm text-[#504440]">No active anomalies. All owls at rest.</p>
              </div>
            ) : (
              anomalies.slice(0, 4).map((a, i) => (
                <motion.div key={a.anomaly_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white/50 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-[#735c00]/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px] text-[#735c00]">
                      {a.severity === 'high' ? 'warning' : a.severity === 'medium' ? 'info' : 'check_circle'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-cinzel text-sm text-[#2c1810]">{a.merchant}</h4>
                      <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                        a.severity === 'high' ? 'bg-[#dc2626]/10 text-[#dc2626]' :
                        a.severity === 'medium' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                        'bg-[#2d6a4f]/10 text-[#2d6a4f]'
                      }`}>{a.severity}</span>
                    </div>
                    <p className="font-crimson text-xs text-[#504440] mb-2">{a.category} — ₹{a.amount.toFixed(0)}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#504440] w-12">Score</span>
                        <div className="flex-1 h-1.5 bg-[#735c00]/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#735c00] rounded-full" style={{ width: `${a.final_score * 100}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-[#504440] w-8 text-right">{Math.round(a.final_score * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-cinzel text-sm text-[#2c1810] uppercase tracking-widest">Category Breakdown</h3>
          </div>
          <div className="space-y-3">
            {categoryData.length === 0 ? (
              <p className="font-crimson text-sm text-[#504440] text-center py-4">No spending data yet.</p>
            ) : (
              categoryData.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#735c00]" />
                    <span className="font-crimson text-sm text-[#2c1810]">{s.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-[#504440]">₹{s.total.toLocaleString()}</span>
                  </div>
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
