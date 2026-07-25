import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

const TAXONOMIES = [
  { name: 'Amount Spike', category: 'financial', severity: 'high' },
  { name: 'Unusual Hour', category: 'temporal', severity: 'medium' },
  { name: 'New Merchant', category: 'behavioral', severity: 'medium' },
  { name: 'Rolling Avg Exceeded', category: 'financial', severity: 'high' },
  { name: 'Location Mismatch', category: 'geographic', severity: 'low' },
]

const PORTKEYS = [
  { name: 'API Key — Gemini', status: 'active', created: 'Jul 20, 2026', expires: 'Aug 20, 2026' },
  { name: 'API Key — ElevenLabs', status: 'active', created: 'Jul 20, 2026', expires: 'Aug 20, 2026' },
  { name: 'Service Token — Gringotts', status: 'expired', created: 'Jun 15, 2026', expires: 'Jul 15, 2026' },
]

export default function AdminSettings() {
  const [darkMode, setDarkMode] = useState(false)
  const [parchmentAge, setParchmentAge] = useState(50)

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Room of Requirement</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Admin settings — configure the room to your needs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Credentials */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">API Credentials</h3>
            <div className="space-y-4">
              {[
                { label: 'Gemini API Key', placeholder: 'AIza...', value: '••••••••••••' },
                { label: 'ElevenLabs API Key', placeholder: 'sk-...', value: '••••••••••••' },
              ].map((field, i) => (
                <div key={i}>
                  <label className="font-crimson text-xs text-[#504440] uppercase tracking-wider block mb-2">{field.label}</label>
                  <div className="flex gap-2">
                    <input type="password" placeholder={field.placeholder} defaultValue={field.value}
                      className="flex-1 px-4 py-2 bg-white border border-[#735c00]/20 rounded-lg font-mono text-sm text-[#2c1810] focus:outline-none focus:border-[#735c00]" />
                    <button className="px-3 py-2 bg-[#735c00]/10 rounded-lg hover:bg-[#735c00]/20 transition-colors">
                      <span className="material-symbols-outlined text-[16px] text-[#735c00]">content_copy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Theme Settings */}
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
                <div className="flex justify-between mt-1">
                  <span className="font-crimson text-[10px] text-[#504440]">Fresh</span>
                  <span className="font-crimson text-[10px] text-[#504440]">Ancient</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mischief Taxonomy */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-cinzel text-sm text-[#2c1810] uppercase tracking-widest">Mischief Taxonomy</h3>
              <button className="text-[#735c00] hover:text-[#2c1810] transition-colors">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
              </button>
            </div>
            <div className="space-y-2">
              {TAXONOMIES.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div>
                    <h4 className="font-crimson text-sm text-[#2c1810]">{t.name}</h4>
                    <span className="font-mono text-[10px] text-[#504440]">{t.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                      t.severity === 'high' ? 'bg-[#dc2626]/10 text-[#dc2626]' :
                      t.severity === 'medium' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                      'bg-[#2d6a4f]/10 text-[#2d6a4f]'
                    }`}>{t.severity}</span>
                    <button className="text-[#504440] hover:text-[#2c1810]"><span className="material-symbols-outlined text-[14px]">edit</span></button>
                    <button className="text-[#dc2626] hover:text-[#dc2626]/80"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Portkey Tokens */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Portkey Tokens</h3>
            <div className="space-y-3">
              {PORTKEYS.map((p, i) => (
                <div key={i} className="p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-crimson text-sm text-[#2c1810]">{p.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                      p.status === 'active' ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]' : 'bg-[#dc2626]/10 text-[#dc2626]'
                    }`}>{p.status}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#504440]">
                    <span>Created: {p.created}</span>
                    <span>Expires: {p.expires}</span>
                  </div>
                  <button className="mt-2 font-crimson text-xs text-[#dc2626] hover:text-[#dc2626]/80 underline underline-offset-2">Revoke</button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-8 text-center">
          <button className="bg-[#735c00] text-white hover:bg-[#5a4a00] transition-all px-8 py-3 rounded-full font-cinzel text-sm inline-flex items-center gap-2 relative overflow-hidden group">
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <span className="material-symbols-outlined text-[18px]">magic_button</span>
            Cast Changes
          </button>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
