import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

const EVENTS = [
  { time: '14:32', source: 'Vault', icon: 'account_balance', msg: 'Gringotts flagged ₹15,000 transfer as suspicious', severity: 'high' },
  { time: '14:28', source: 'Map', icon: 'map', msg: 'New anomaly detected at Diagon Alley location', severity: 'medium' },
  { time: '14:15', source: 'Owlry', icon: 'pets', msg: 'Pigwidgeon delivered 3 urgent dispatches', severity: 'low' },
  { time: '13:50', source: 'Registry', icon: 'shield', msg: 'Authentication echo verified for Harry Potter', severity: 'low' },
  { time: '13:22', source: 'Pensieve', icon: 'insights', msg: 'Weekly analysis complete — 12 incidents cataloged', severity: 'low' },
  { time: '12:45', source: 'Vault', icon: 'account_balance', msg: 'Unauthorized access attempt blocked', severity: 'high' },
  { time: '12:10', source: 'Map', icon: 'map', msg: 'Footprint trail analysis: 3 connected anomalies', severity: 'medium' },
]

const CASTLE_STATUS = [
  { area: 'Great Hall', status: 'secure', occupants: 42 },
  { area: 'Vaults', status: 'secure', occupants: 3 },
  { area: 'Owlry', status: 'active', occupants: 8 },
  { area: 'Restricted Section', status: 'locked', occupants: 0 },
]

const MARAUDERS = [
  { name: 'Moony', status: 'active' },
  { name: 'Wormtail', status: 'active' },
  { name: 'Padfoot', status: 'away' },
  { name: 'Prongs', status: 'offline' },
]

export default function GreatHall() {
  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Great Hall</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Global activity stream — all that happens in the castle</p>
        </div>

        {/* Floating Candles */}
        <div className="relative h-16 mb-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i}
              className="absolute"
              style={{ left: `${10 + i * 12}%`, top: `${10 + (i % 3) * 20}%` }}
              animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}>
              <svg width="12" height="20" viewBox="0 0 12 20">
                <rect x="4" y="8" width="4" height="12" fill="#f5e6c8" rx="1" />
                <ellipse cx="6" cy="6" rx="4" ry="6" fill="#d4af37" opacity="0.8" />
                <ellipse cx="6" cy="4" rx="2" ry="3" fill="#fff" opacity="0.4" />
              </svg>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Feed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Activity Stream</h3>
            <div className="space-y-3">
              {EVENTS.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-4 p-3 rounded-lg ${
                    e.severity === 'high' ? 'bg-[#dc2626]/5 border-l-2 border-[#dc2626]' :
                    e.severity === 'medium' ? 'bg-[#d4af37]/5 border-l-2 border-[#d4af37]' :
                    'bg-white/50 border-l-2 border-[#504440]/20'
                  }`}>
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
            <button className="w-full mt-4 py-2 text-center font-crimson text-sm text-[#735c00] hover:text-[#2c1810] border border-[#735c00]/20 rounded-lg hover:border-[#735c00]/40 transition-colors">
              Load More Entries
            </button>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Castle Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
              <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Castle Status</h3>
              <div className="space-y-3">
                {CASTLE_STATUS.map((c, i) => (
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

            {/* Active Marauders */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
              <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Active Marauders</h3>
              <div className="space-y-2">
                {MARAUDERS.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <span className="font-crimson text-sm text-[#2c1810]">{m.name}</span>
                    <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                      m.status === 'active' ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]' :
                      m.status === 'away' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                      'bg-[#504440]/10 text-[#504440]'
                    }`}>{m.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
