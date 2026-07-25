import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAnomalies } from '../hooks/useAnomalies'

export default function RestrictedSection() {
  const { data: anomalies = [] } = useAnomalies()

  const highAnomalies = anomalies.filter((a) => a.severity === 'high')
  const medAnomalies = anomalies.filter((a) => a.severity === 'medium')

  const [protocols, setProtocols] = useState([
    { name: 'Anti-Disapparition Jinx', desc: 'Prevents unauthorized access within vault perimeter', enabled: true },
    { name: 'Muggle-Repelling Charm', desc: 'Deters non-magical persons from sensitive areas', enabled: true },
    { name: 'Fidelius Charm', desc: 'Conceals location of secret assets', enabled: false },
    { name: 'Protego Totalum', desc: 'Shields all perimeter boundaries', enabled: true },
    { name: 'Salvio Hexia', desc: 'Repels hexes and jinxes from records', enabled: false },
  ])

  const toggleProtocol = (index: number) => {
    setProtocols((prev) => prev.map((p, i) => i === index ? { ...p, enabled: !p.enabled } : p))
  }

  const INTRUSIONS = [
    ...highAnomalies.slice(0, 2).map((a) => ({
      time: a.detected_at ? new Date(a.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '14:32',
      source: `${a.merchant} — Unusual activity`,
      level: 'critical' as const,
      location: a.category,
    })),
    ...medAnomalies.slice(0, 2).map((a) => ({
      time: a.detected_at ? new Date(a.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '13:15',
      source: `${a.merchant} — Pattern anomaly`,
      level: 'warn' as const,
      location: a.category,
    })),
  ]

  const fallbackIntrusions = [
    { time: '14:32', source: 'No intrusions detected', level: 'info' as const, location: 'System' },
  ]

  const displayIntrusions = INTRUSIONS.length > 0 ? INTRUSIONS : fallbackIntrusions

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Restricted Section</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Security protocols & permissions — only the worthy may enter</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Threat Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white/50 rounded-lg text-center">
                <div className="font-cinzel text-2xl text-[#dc2626]">{highAnomalies.length}</div>
                <span className="font-crimson text-xs text-[#504440]">Critical Threats</span>
              </div>
              <div className="p-4 bg-white/50 rounded-lg text-center">
                <div className="font-cinzel text-2xl text-[#d4af37]">{medAnomalies.length}</div>
                <span className="font-crimson text-xs text-[#504440]">Warnings</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-white/50 rounded-lg">
                <h4 className="font-crimson text-sm text-[#2c1810] font-semibold">System Status</h4>
                <p className="font-crimson text-xs text-[#2d6a4f]">All perimeter wards active</p>
              </div>
              <div className="p-3 bg-white/50 rounded-lg">
                <h4 className="font-crimson text-sm text-[#2c1810] font-semibold">Last Scan</h4>
                <p className="font-crimson text-xs text-[#504440]">All anomalies accounted for</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-8 bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Intrusion Log</h3>
          <div className="space-y-2">
            {displayIntrusions.map((log, i) => (
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
