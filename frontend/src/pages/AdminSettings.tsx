import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAnomalies } from '../hooks/useAnomalies'

export default function AdminSettings() {
  const { data: anomalies = [] } = useAnomalies()
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark'
    }
    return false
  })
  const [parchmentAge, setParchmentAge] = useState(50)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const highCount = anomalies.filter((a) => a.severity === 'high').length
  const medCount = anomalies.filter((a) => a.severity === 'medium').length

  const TAXONOMIES = [
    { name: 'Amount Spike', category: 'financial', severity: 'high' },
    { name: 'Unusual Hour', category: 'temporal', severity: 'medium' },
    { name: 'New Merchant', category: 'behavioral', severity: 'medium' },
    { name: 'Rolling Avg Exceeded', category: 'financial', severity: 'high' },
    { name: 'Location Mismatch', category: 'geographic', severity: 'low' },
  ]

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Room of Requirement</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Admin settings — configure the room to your needs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">System Overview</h3>
            <div className="space-y-4">
              <div className="p-3 bg-white/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-crimson text-sm text-[#2c1810]">Total Anomalies</span>
                  <span className="font-mono text-xs text-[#735c00]">{anomalies.length}</span>
                </div>
              </div>
              <div className="p-3 bg-white/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-crimson text-sm text-[#2c1810]">Critical Alerts</span>
                  <span className="font-mono text-xs text-[#dc2626]">{highCount}</span>
                </div>
              </div>
              <div className="p-3 bg-white/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-crimson text-sm text-[#2c1810]">Warnings</span>
                  <span className="font-mono text-xs text-[#d4af37]">{medCount}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Appearance</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-crimson text-sm text-[#2c1810]">Theme</h4>
                  <p className="font-crimson text-xs text-[#504440]">Lumos (Light) or Nox (Dark)</p>
                </div>
                <button onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-[#2c1810]' : 'bg-[#d4af37]'}`}>
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform flex items-center justify-center ${
                    darkMode ? 'left-8' : 'left-1'
                  }`}>
                    <span className="material-symbols-outlined text-[12px] text-[#2c1810]">
                      {darkMode ? 'dark_mode' : 'light_mode'}
                    </span>
                  </span>
                </button>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-crimson text-sm text-[#2c1810]">Parchment Aging</h4>
                  <span className="font-mono text-xs text-[#504440]">{parchmentAge}%</span>
                </div>
                <input type="range" min="0" max="100" value={parchmentAge} onChange={(e) => setParchmentAge(Number(e.target.value))}
                  className="w-full h-2 bg-[#735c00]/20 rounded-full appearance-none cursor-pointer accent-[#735c00]" />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Mischief Taxonomy</h3>
            <div className="space-y-2">
              {TAXONOMIES.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div>
                    <h4 className="font-crimson text-sm text-[#2c1810]">{t.name}</h4>
                    <span className="font-mono text-[10px] text-[#504440]">{t.category}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                    t.severity === 'high' ? 'bg-[#dc2626]/10 text-[#dc2626]' :
                    t.severity === 'medium' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                    'bg-[#2d6a4f]/10 text-[#2d6a4f]'
                  }`}>{t.severity}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">API Status</h3>
            <div className="space-y-3">
              {[
                { name: 'Gemini AI', status: 'active', desc: 'Narrative generation' },
                { name: 'ElevenLabs', status: 'active', desc: 'TTS audio generation' },
                { name: 'ML Ensemble', status: 'active', desc: '7-model anomaly detection' },
                { name: 'SQLite DB', status: 'active', desc: 'Persistent data storage' },
              ].map((p, i) => (
                <div key={i} className="p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-crimson text-sm text-[#2c1810]">{p.name}</h4>
                    <span className="px-2 py-0.5 rounded-full font-crimson text-[10px] bg-[#2d6a4f]/10 text-[#2d6a4f]">{p.status}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#504440]">{p.desc}</span>
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
