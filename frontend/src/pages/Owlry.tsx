import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

const OWLS = [
  { name: 'Errol', type: 'Great Grey Owl', speed: 85, stamina: 70, health: 'Excellent', status: 'active', missions: 12 },
  { name: 'Pigwidgeon', type: 'Scops Owl', speed: 95, stamina: 60, health: 'Good', status: 'in-flight', missions: 8 },
  { name: 'Hedwig', type: 'Snowy Owl', speed: 90, stamina: 85, health: 'Excellent', status: 'active', missions: 24 },
  { name: 'Buckbeak', type: 'Hippogriff', speed: 70, stamina: 95, health: 'Good', status: 'resting', missions: 6 },
]

const SUPPLIES = [
  { item: ' owl feathers', qty: 240, status: 'adequate' },
  { item: ' parchment scrolls', qty: 180, status: 'adequate' },
  { item: ' sealing wax', qty: 45, status: 'low' },
  { item: ' moonstone dust', qty: 12, status: 'critical' },
]

export default function Owlry() {
  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Owlry</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Messenger fleet management — every owl accounted for</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Fleet', value: '42', icon: 'pets' },
            { label: 'In Flight', value: '12', icon: 'flight' },
            { label: 'Missions Today', value: '18', icon: 'mail' },
            { label: 'Avg Speed', value: '87%', icon: 'speed' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-5 shadow-md text-center">
              <span className="material-symbols-outlined text-[24px] text-[#735c00] mb-2 block">{s.icon}</span>
              <div className="font-mono text-xs text-[#504440] mb-1">{s.label}</div>
              <div className="font-cinzel text-xl text-[#2c1810]">{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Owl Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-8">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Active Owls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OWLS.map((owl, i) => (
              <motion.div key={owl.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white/50 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-[#735c00]/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px] text-[#735c00]">pets</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-cinzel text-sm text-[#2c1810]">{owl.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                      owl.status === 'active' ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]' :
                      owl.status === 'in-flight' ? 'bg-[#735c00]/10 text-[#735c00]' :
                      'bg-[#504440]/10 text-[#504440]'
                    }`}>{owl.status}</span>
                  </div>
                  <p className="font-crimson text-xs text-[#504440] mb-2">{owl.type} — {owl.missions} missions</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#504440] w-12">Speed</span>
                      <div className="flex-1 h-1.5 bg-[#735c00]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#735c00] rounded-full" style={{ width: `${owl.speed}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-[#504440] w-8 text-right">{owl.speed}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#504440] w-12">Stamina</span>
                      <div className="flex-1 h-1.5 bg-[#735c00]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2d6a4f] rounded-full" style={{ width: `${owl.stamina}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-[#504440] w-8 text-right">{owl.stamina}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Supplies */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-cinzel text-sm text-[#2c1810] uppercase tracking-widest">Supply Inventory</h3>
            <button className="bg-[#735c00] text-white hover:bg-[#5a4a00] transition-all px-4 py-2 rounded-full flex items-center gap-2 text-sm font-crimson">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Requisition Supplies
            </button>
          </div>
          <div className="space-y-3">
            {SUPPLIES.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    s.status === 'adequate' ? 'bg-[#2d6a4f]' : s.status === 'low' ? 'bg-[#d4af37]' : 'bg-[#dc2626]'
                  }`} />
                  <span className="font-crimson text-sm text-[#2c1810]">{s.item}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-[#504440]">{s.qty} units</span>
                  <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                    s.status === 'adequate' ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]' :
                    s.status === 'low' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                    'bg-[#dc2626]/10 text-[#dc2626]'
                  }`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
