import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

const GAUGES = [
  { label: 'Hogwarts Tower', ping: 12, status: 'optimal' },
  { label: 'Great Hall', ping: 8, status: 'optimal' },
  { label: 'Dungeon Chambers', ping: 45, status: 'degraded' },
]

const FAULTS = [
  { time: '14:32', level: 'critical', msg: 'Memory leak in Pensieve module — allocated 2.4GB', source: 'pensieve-service' },
  { time: '14:28', level: 'warn', msg: 'High latency on Gringotts API — 450ms p99', source: 'vault-connector' },
  { time: '14:15', level: 'info', msg: 'Scheduled backup completed — 847 records archived', source: 'backup-daemon' },
  { time: '13:50', level: 'warn', msg: 'Owlry queue depth exceeds threshold — 23 pending', source: 'owlry-dispatcher' },
  { time: '13:22', level: 'info', msg: 'ML model cache refreshed — 7 models loaded', source: 'inference-engine' },
  { time: '12:45', level: 'critical', msg: 'Database connection pool exhausted — 50/50 active', source: 'db-pool' },
]

export default function OEA() {
  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">O.E.A. Diagnostics</h1>
          <p className="font-crimson text-sm text-[#504440] italic">System health monitoring — the eyes of the Ministry</p>
        </div>

        {/* Latency Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {GAUGES.map((g, i) => (
            <motion.div key={g.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-6 shadow-md text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#735c0020" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none"
                    stroke={g.ping < 20 ? '#2d6a4f' : g.ping < 40 ? '#d4af37' : '#dc2626'}
                    strokeWidth="3"
                    strokeDasharray={`${Math.min(g.ping * 2, 94)} 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-lg text-[#2c1810]">{g.ping}ms</span>
              </div>
              <h4 className="font-cinzel text-sm text-[#2c1810] mb-1">{g.label}</h4>
              <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                g.status === 'optimal' ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]' : 'bg-[#d4af37]/10 text-[#d4af37]'
              }`}>{g.status}</span>
            </motion.div>
          ))}
        </div>

        {/* Fleet Vitals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { label: 'Owl Uptime', value: 99.7, unit: '%', color: 'bg-[#2d6a4f]' },
            { label: 'Soot Levels', value: 12, unit: '%', color: 'bg-[#d4af37]' },
            { label: 'Compute Usage', value: 67, unit: '%', color: 'bg-[#735c00]' },
            { label: 'Memory Usage', value: 78, unit: '%', color: 'bg-[#dc2626]' },
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

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex gap-4 mb-8">
          <button className="bg-[#dc2626] text-white hover:bg-[#dc2626]/80 transition-all px-6 py-2 rounded-full flex items-center gap-2 text-sm font-crimson">
            <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
            Initiate Cleansing Purge
          </button>
          <div className="flex items-center gap-2 px-4 bg-[#faf3e6] rounded-full border border-[#735c00]/20">
            <span className="material-symbols-outlined text-[16px] text-[#735c00]">shield</span>
            <span className="font-crimson text-sm text-[#2c1810]">Protego: Active</span>
            <div className="w-2 h-2 bg-[#2d6a4f] rounded-full animate-pulse" />
          </div>
        </motion.div>

        {/* Fault Log */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Spell Stack Log</h3>
          <div className="space-y-2">
            {FAULTS.map((f, i) => (
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
