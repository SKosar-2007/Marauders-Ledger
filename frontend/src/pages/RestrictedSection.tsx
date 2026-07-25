import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

const PROTOCOLS = [
  { name: 'Anti-Disapparition Jinx', desc: 'Prevents unauthorized appition within vault perimeter', enabled: true },
  { name: 'Muggle-Repelling Charm', desc: 'Deters non-magical persons from sensitive areas', enabled: true },
  { name: 'Fidelius Charm', desc: 'Conceals location of secret assets', enabled: false },
  { name: 'Protego Totalum', desc: 'Shields all perimeter boundaries', enabled: true },
  { name: 'Salvio Hexia', desc: 'Repels hexes and jinxes from records', enabled: false },
]

const GUARDIANS = [
  { name: 'Alastor Moody', access: ['vault', 'map', 'registry'], level: 'admin' },
  { name: 'Nymphadora Tonks', access: ['map', 'owlry'], level: 'auror' },
  { name: 'Kingsley Shacklebolt', access: ['vault', 'pensieve', 'registry'], level: 'admin' },
  { name: 'Cornelius Fudge', access: ['daily-prophet'], level: 'ministry' },
]

const INTRUSIONS = [
  { time: '14:32', source: 'Unregistered Portkey', level: 'warn', location: 'Vault perimeter' },
  { time: '13:15', source: 'Failed authentication echo', level: 'info', location: 'Restricted Section' },
  { time: '11:48', source: 'Polyjuice residue detected', level: 'critical', location: 'Great Hall' },
  { time: '09:22', source: 'Unauthorized Owl intercepted', level: 'info', location: 'Owlry' },
]

export default function RestrictedSection() {
  const [protocols, setProtocols] = useState(PROTOCOLS)

  const toggleProtocol = (index: number) => {
    setProtocols((prev) => prev.map((p, i) => i === index ? { ...p, enabled: !p.enabled } : p))
  }

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Restricted Section</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Security protocols & permissions — only the worthy may enter</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Protocols */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Security Protocols</h3>
            <div className="space-y-3">
              {protocols.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-crimson text-sm text-[#2c1810] font-semibold">{p.name}</h4>
                    <p className="font-crimson text-xs text-[#504440]">{p.desc}</p>
                  </div>
                  <button onClick={() => toggleProtocol(i)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      p.enabled ? 'bg-[#2d6a4f]' : 'bg-[#504440]/30'
                    }`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      p.enabled ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Guardian Permissions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Guardian Permissions</h3>
            <div className="space-y-3">
              {GUARDIANS.map((g, i) => (
                <div key={i} className="p-4 bg-white/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-crimson text-sm text-[#2c1810] font-semibold">{g.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                      g.level === 'admin' ? 'bg-[#dc2626]/10 text-[#dc2626]' :
                      g.level === 'auror' ? 'bg-[#735c00]/10 text-[#735c00]' :
                      'bg-[#504440]/10 text-[#504440]'
                    }`}>{g.level}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {g.access.map((a) => (
                      <span key={a} className="px-2 py-0.5 bg-[#735c00]/10 text-[#735c00] rounded font-mono text-[10px]">{a}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="font-crimson text-xs text-[#735c00] hover:text-[#2c1810] underline underline-offset-2">Edit</button>
                    <button className="font-crimson text-xs text-[#dc2626] hover:text-[#dc2626]/80 underline underline-offset-2">Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Intrusion Log */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-8 bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Intrusion Log</h3>
          <div className="space-y-2">
            {INTRUSIONS.map((log, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg ${
                log.level === 'critical' ? 'bg-[#dc2626]/5 border-l-2 border-[#dc2626]' :
                log.level === 'warn' ? 'bg-[#d4af37]/5 border-l-2 border-[#d4af37]' :
                'bg-white/50 border-l-2 border-[#504440]/20'
              }`}>
                <span className="material-symbols-outlined text-[18px] text-[#735c00]">fingerprint</span>
                <span className="font-mono text-xs text-[#504440] w-12">{log.time}</span>
                <span className="font-crimson text-sm text-[#2c1810] flex-1">{log.source}</span>
                <span className="font-crimson text-xs text-[#504440]">{log.location}</span>
                <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                  log.level === 'critical' ? 'bg-[#dc2626]/10 text-[#dc2626]' :
                  log.level === 'warn' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                  'bg-[#504440]/10 text-[#504440]'
                }`}>{log.level}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
