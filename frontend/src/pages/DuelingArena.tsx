import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

const SPELL_HISTORY = [
  { spell: 'SELECT anomalies FROM ledger WHERE score > 0.7', time: '12ms', status: 'success' },
  { spell: 'INSERT INTO narratives (anomaly_id, text) VALUES (...)', time: '8ms', status: 'success' },
  { spell: 'UPDATE anomalies SET status = "confirmed" WHERE ...', time: '15ms', status: 'success' },
  { spell: 'SELECT * FROM transactions ORDER BY amount DESC LIMIT 10', time: '23ms', status: 'success' },
  { spell: 'DELETE FROM cache WHERE ttl < NOW()', time: '5ms', status: 'success' },
]

const ACTIVE_JINXES = [
  { name: 'Real-time Anomaly Stream', rps: 1240, status: 'active' },
  { name: 'Narrative Generation Queue', rps: 45, status: 'active' },
  { name: 'TTS Audio Pipeline', rps: 12, status: 'active' },
]

export default function DuelingArena() {
  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Dueling Arena</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Performance benchmarking — where spells are tested</p>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md text-center">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Spells Per Second</h3>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#735c0020" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#2d6a4f" strokeWidth="3"
                  strokeDasharray="85 100" strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-cinzel text-2xl text-[#2c1810]">1,247</span>
                <span className="font-crimson text-[10px] text-[#504440]">req/sec</span>
              </span>
            </div>
            <p className="font-crimson text-xs text-[#2d6a4f]">↑ 12% from last hour</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md text-center">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Response Time</h3>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#735c0020" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#735c00" strokeWidth="3"
                  strokeDasharray="35 100" strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-cinzel text-2xl text-[#2c1810]">42ms</span>
                <span className="font-crimson text-[10px] text-[#504440]">p95 latency</span>
              </span>
            </div>
            <p className="font-crimson text-xs text-[#2d6a4f]">↓ 8% from last hour</p>
          </motion.div>
        </div>

        {/* Spell Fire Visualization */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-8">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">Spell Fire — Server vs Client</h3>
          <div className="relative h-32 bg-[#2c1810]/5 rounded-lg overflow-hidden">
            <svg viewBox="0 0 400 100" className="w-full h-full">
              {/* Server attacks */}
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.circle key={`s${i}`}
                  cx={50 + Math.random() * 300} cy={20 + Math.random() * 60}
                  r="2" fill="#735c00"
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                  transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }} />
              ))}
              {/* Client attacks */}
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.circle key={`c${i}`}
                  cx={50 + Math.random() * 300} cy={20 + Math.random() * 60}
                  r="2" fill="#dc2626"
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                  transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }} />
              ))}
              {/* Dividing line */}
              <line x1="200" y1="0" x2="200" y2="100" stroke="#735c00" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
              <text x="100" y="15" fill="#735c00" fontSize="10" textAnchor="middle" fontFamily="monospace">Server</text>
              <text x="300" y="15" fill="#dc2626" fontSize="10" textAnchor="middle" fontFamily="monospace">Client</text>
            </svg>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shield Strength */}
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

          {/* Active Jinxes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Active Jinxes</h3>
            <div className="space-y-3">
              {ACTIVE_JINXES.map((j, i) => (
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

        {/* Spell History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-8 bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Spell History</h3>
          <div className="space-y-2">
            {SPELL_HISTORY.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white/50 rounded-lg font-mono text-xs">
                <span className="material-symbols-outlined text-[14px] text-[#2d6a4f]">check_circle</span>
                <span className="flex-1 text-[#2c1810] truncate">{s.spell}</span>
                <span className="text-[#504440]">{s.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
