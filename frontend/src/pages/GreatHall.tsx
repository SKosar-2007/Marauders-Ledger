import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAnomalies } from '../hooks/useAnomalies'
import { useSpendingByDay } from '../hooks/useSpending'
import { useAuth } from '../context/AuthContext'

export default function GreatHall() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: anomalies = [] } = useAnomalies()
  const { data: spendingData = [] } = useSpendingByDay()

  const totalSpent = spendingData.reduce((sum, d) => sum + d.amount, 0)

  const EVENTS = anomalies.slice(0, 7).map((a: any, i: number) => ({
    time: a.detected_at ? new Date(a.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${14 - i}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    source: a.category,
    icon: a.severity === 'high' ? 'warning' : a.severity === 'medium' ? 'info' : 'check_circle',
    msg: `${a.severity === 'high' ? 'Critical' : 'Anomaly'}: ${a.merchant} — ₹${a.amount.toFixed(0)}`,
    severity: a.severity,
    id: a.anomaly_id,
  }))

  const fallbackEvents = [
    { time: '14:32', source: 'Vault', icon: 'account_balance', msg: 'No anomalies yet — upload a ledger to begin', severity: 'low', id: '' },
  ]

  const displayEvents = EVENTS.length > 0 ? EVENTS : fallbackEvents

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24 relative z-10">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Great Hall</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Global activity stream — all that happens in the castle</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Activity Stream</h3>
            <div className="space-y-3">
              {displayEvents.map((e, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-start gap-4 p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${
                    e.severity === 'high' ? 'bg-[#dc2626]/5 border-l-2 border-[#dc2626]' :
                    e.severity === 'medium' ? 'bg-[#d4af37]/5 border-l-2 border-[#d4af37]' :
                    'bg-white/50 border-l-2 border-[#504440]/20'
                  }`}
                  onClick={() => e.id && navigate(`/anomaly/${e.id}`)}>
                  <span className="material-symbols-outlined text-[18px] text-[#735c00] mt-0.5">{e.icon}</span>
                  <div className="flex-1">
                    <p className="font-crimson text-sm text-[#2c1810]">{e.msg}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-mono text-[10px] text-[#504440]">{e.time}</span>
                      <span className="px-2 py-0.5 bg-[#735c00]/10 text-[#735c00] rounded font-mono text-[10px]">{e.source}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
              <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Castle Status</h3>
              <div className="space-y-3">
                {[
                  { area: 'Dashboard', status: 'secure', occupants: anomalies.length },
                  { area: 'Ledger', status: 'secure', occupants: anomalies.filter((a) => a.severity === 'high').length },
                  { area: 'Owl Post', status: 'active', occupants: anomalies.filter((a) => a.severity === 'medium').length },
                  { area: 'Vault', status: 'secure', occupants: spendingData.length },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        c.status === 'secure' ? 'bg-[#2d6a4f]' :
                        c.status === 'active' ? 'bg-[#735c00]' : 'bg-[#504440]/30'
                      }`} />
                      <span className="font-crimson text-sm text-[#2c1810]">{c.area}</span>
                    </div>
                    <span className="font-mono text-xs text-[#504440]">{c.occupants}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
              <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Session Info</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                  <span className="font-crimson text-sm text-[#2c1810]">{user?.name || 'Wizard'}</span>
                  <span className="px-2 py-0.5 rounded-full font-crimson text-[10px] bg-[#2d6a4f]/10 text-[#2d6a4f]">active</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                  <span className="font-crimson text-sm text-[#504440]">Total Anomalies</span>
                  <span className="font-mono text-xs text-[#735c00]">{anomalies.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                  <span className="font-crimson text-sm text-[#504440]">Total Spent</span>
                  <span className="font-mono text-xs text-[#735c00]">₹{totalSpent.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
