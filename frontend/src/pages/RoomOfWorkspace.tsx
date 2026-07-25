import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function RoomOfWorkspace() {
  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Room of Requirement</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Your personalized workspace — it appears when you need it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Footprint Tracker Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Active Tracking</h3>
            <div className="relative h-40 bg-[#2c1810]/5 rounded-lg overflow-hidden">
              <svg viewBox="0 0 200 120" className="w-full h-full">
                <path d="M20,100 Q50,20 100,60 T180,30" fill="none" stroke="#735c00" strokeWidth="2" strokeDasharray="4,4" />
                {[
                  { x: 40, y: 85 }, { x: 70, y: 50 }, { x: 100, y: 60 },
                  { x: 130, y: 40 }, { x: 160, y: 30 },
                ].map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#735c00" opacity={0.3 + i * 0.15} />
                    <circle cx={p.x} cy={p.y} r="2" fill="#735c00" />
                  </g>
                ))}
              </svg>
            </div>
            <p className="font-crimson text-xs text-[#504440] mt-2 italic">5 anomalies tracked across 3 locations</p>
          </motion.div>

          {/* Vault Quick View */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Vault 713</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#735c0020" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#d4af37" strokeWidth="3"
                    strokeDasharray="72 100" strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-[#2c1810]">72%</span>
              </div>
              <div>
                <div className="font-cinzel text-2xl text-[#735c00]">₹124,350</div>
                <p className="font-crimson text-xs text-[#504440]">Available Balance</p>
                <p className="font-crimson text-xs text-[#2d6a4f]">+₹2,400 this month</p>
              </div>
            </div>
          </motion.div>

          {/* Recent Intercepts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Recent Intercepts</h3>
            <div className="space-y-3">
              {[
                { from: 'Unknown', subject: 'Suspicious vault access attempt', time: '2h ago', severity: 'high' },
                { from: 'Ministry', subject: 'Monthly audit reminder', time: '1d ago', severity: 'low' },
                { from: 'Gringotts', subject: 'Large transaction flagged', time: '3d ago', severity: 'medium' },
              ].map((m, i) => (
                <div key={i} className="p-3 bg-white/50 rounded-lg flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    m.severity === 'high' ? 'bg-[#dc2626]' : m.severity === 'medium' ? 'bg-[#d4af37]' : 'bg-[#2d6a4f]'
                  }`} />
                  <div className="flex-1">
                    <p className="font-crimson text-sm text-[#2c1810]">{m.subject}</p>
                    <div className="flex justify-between mt-1">
                      <span className="font-crimson text-xs text-[#504440]">From: {m.from}</span>
                      <span className="font-mono text-[10px] text-[#504440]">{m.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active Jinxes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Active Jinxes</h3>
            <div className="space-y-3">
              {[
                { name: 'Amount Spike Detection', progress: 85, active: true },
                { name: 'Unusual Hour Monitor', progress: 72, active: true },
                { name: 'New Merchant Alert', progress: 45, active: false },
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

        {/* Add Requirement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-8 text-center">
          <button className="bg-[#735c00] text-white hover:bg-[#5a4a00] transition-all px-8 py-3 rounded-full font-cinzel text-sm inline-flex items-center gap-2 ink-ripple">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add New Requirement
          </button>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
