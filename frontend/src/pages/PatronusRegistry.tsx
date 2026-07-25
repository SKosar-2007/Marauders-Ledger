import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

const WIZARDS = [
  { name: 'Harry Potter', patronus: 'Stag', ward: 92, authenticated: true },
  { name: 'Hermione Granger', patronus: 'Otter', ward: 88, authenticated: true },
  { name: 'Ron Weasley', patronus: 'Jack Russell Terrier', ward: 75, authenticated: true },
  { name: 'Luna Lovegood', patronus: 'Hare', ward: 80, authenticated: false },
  { name: 'Neville Longbottom', patronus: 'Hedgehog', ward: 70, authenticated: true },
  { name: 'Ginny Weasley', patronus: 'Horse', ward: 85, authenticated: true },
]

const AUTH_LOG = [
  { wizard: 'Harry Potter', time: '14:32', status: 'success', method: 'Wand echo' },
  { wizard: 'Hermione Granger', time: '14:28', status: 'success', method: 'Patronus charm' },
  { wizard: 'Luna Lovegood', time: '14:15', status: 'failed', method: 'Password' },
  { wizard: 'Ron Weasley', time: '13:50', status: 'success', method: 'Wand echo' },
]

export default function PatronusRegistry() {
  const [search, setSearch] = useState('')

  const filtered = WIZARDS.filter((w) =>
    search === '' || w.name.toLowerCase().includes(search.toLowerCase()) || w.patronus.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">Patronus Registry</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Identity & access directory — every wizard accounted for</p>
        </div>

        {/* Ward Strength */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-8">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Ward Strength</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Perimeter Shield', strength: 95 },
              { name: 'Anti-Apparition', strength: 88 },
              { name: 'Memory Charm', strength: 72 },
              { name: 'Fidelius', strength: 60 },
            ].map((w, i) => (
              <div key={i} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#735c0020" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#735c00" strokeWidth="3"
                      strokeDasharray={`${w.strength * 0.94} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[#2c1810]">{w.strength}%</span>
                </div>
                <span className="font-crimson text-xs text-[#504440]">{w.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wizard Directory */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-cinzel text-sm text-[#2c1810] uppercase tracking-widest">Registered Wizards</h3>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#735c00] text-[16px]">search</span>
                <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-6 pr-4 py-1 bg-transparent border-b border-[#735c00]/30 focus:border-[#735c00] outline-none font-crimson text-sm text-[#2c1810]" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((w, i) => (
                <motion.div key={w.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="bg-white/50 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-[#735c00]/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px] text-[#735c00]">person</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-crimson text-sm text-[#2c1810] font-semibold">{w.name}</h4>
                    <p className="font-crimson text-xs text-[#504440]">Patronus: {w.patronus}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-[#735c00]">{w.ward}%</div>
                    <span className={`text-[10px] ${w.authenticated ? 'text-[#2d6a4f]' : 'text-[#dc2626]'}`}>
                      {w.authenticated ? '✓ verified' : '✗ pending'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Auth Log */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Authentication Echo</h3>
            <div className="space-y-3">
              {AUTH_LOG.map((log, i) => (
                <div key={i} className="p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-crimson text-sm text-[#2c1810]">{log.wizard}</span>
                    <span className={`material-symbols-outlined text-[14px] ${log.status === 'success' ? 'text-[#2d6a4f]' : 'text-[#dc2626]'}`}>
                      {log.status === 'success' ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-crimson text-xs text-[#504440]">{log.method}</span>
                    <span className="font-mono text-[10px] text-[#504440]">{log.time}</span>
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
