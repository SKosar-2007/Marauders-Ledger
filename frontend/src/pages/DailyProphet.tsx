import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAnomalies } from '../hooks/useAnomalies'

export default function DailyProphet() {
  const [dept, setDept] = useState('auror')
  const [type, setType] = useState('anomaly')
  const [format, setFormat] = useState('scroll')
  const { data: anomalies = [] } = useAnomalies()

  const RECENT_EXPORTS = anomalies.slice(0, 3).map((a) => ({
    name: `${a.category} Report — ${a.merchant}`,
    type: 'Standard Scroll',
    date: a.detected_at ? new Date(a.detected_at).toLocaleDateString() : 'Jul 25, 2026',
    status: 'ready',
  }))

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Daily Prophet</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Reporting & Export Center — All the news that's fit to print</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Materialize New Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="font-crimson text-xs text-[#504440] uppercase tracking-wider block mb-2">Department</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#735c00]/20 rounded-lg font-crimson text-sm text-[#2c1810] focus:outline-none focus:border-[#735c00]">
                  <option value="auror">Auror Office</option>
                  <option value="gringotts">Gringotts Audit</option>
                  <option value="pensieve">Pensieve Lab</option>
                  <option value="owlry">Owlry Division</option>
                </select>
              </div>
              <div>
                <label className="font-crimson text-xs text-[#504440] uppercase tracking-wider block mb-2">Report Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#735c00]/20 rounded-lg font-crimson text-sm text-[#2c1810] focus:outline-none focus:border-[#735c00]">
                  <option value="anomaly">Anomaly Summary</option>
                  <option value="financial">Financial Overview</option>
                  <option value="mischief">Mischief Catalog</option>
                  <option value="risk">Risk Assessment</option>
                </select>
              </div>
              <div>
                <label className="font-crimson text-xs text-[#504440] uppercase tracking-wider block mb-2">Date Range</label>
                <input type="date" className="w-full px-4 py-2 bg-white border border-[#735c00]/20 rounded-lg font-crimson text-sm text-[#2c1810] focus:outline-none focus:border-[#735c00]" />
              </div>
              <div>
                <label className="font-crimson text-xs text-[#504440] uppercase tracking-wider block mb-2">Output Format</label>
                <div className="flex gap-4 mt-2">
                  {[
                    { value: 'scroll', label: 'Standard Scroll', icon: 'description' },
                    { value: 'sealed', label: 'Sealed Ledger', icon: 'lock' },
                  ].map((f) => (
                    <label key={f.value} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                      format === f.value ? 'border-[#735c00] bg-[#735c00]/10' : 'border-[#735c00]/20 hover:border-[#735c00]/40'
                    }`}>
                      <input type="radio" name="format" value={f.value} checked={format === f.value}
                        onChange={(e) => setFormat(e.target.value)} className="sr-only" />
                      <span className={`material-symbols-outlined text-[18px] ${format === f.value ? 'text-[#735c00]' : 'text-[#504440]'}`}>{f.icon}</span>
                      <span className="font-crimson text-sm text-[#2c1810]">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button className="w-full bg-[#735c00] text-white hover:bg-[#5a4a00] transition-all py-3 rounded-xl font-cinzel text-sm flex items-center justify-center gap-2 relative overflow-hidden group">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
              Materialize Report
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Ministry Directives</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/50 rounded-lg border-l-2 border-[#735c00]">
                <h4 className="font-cinzel text-xs text-[#2c1810] mb-1">Anomaly Review Policy</h4>
                <p className="font-crimson text-sm text-[#504440]">All high-severity anomalies must be reviewed within 24 hours.</p>
                <span className="font-mono text-[10px] text-[#504440] mt-2 block">Active</span>
              </div>
              <div className="p-4 bg-white/50 rounded-lg border-l-2 border-[#735c00]">
                <h4 className="font-cinzel text-xs text-[#2c1810] mb-1">Export Format v2.1</h4>
                <p className="font-crimson text-sm text-[#504440]">New export format "Sealed Ledger" now available for sensitive data.</p>
                <span className="font-mono text-[10px] text-[#504440] mt-2 block">Active</span>
              </div>
            </div>
          </motion.div>
        </div>

        {RECENT_EXPORTS.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-8 bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Recent Exports</h3>
            <div className="grid grid-cols-[1fr_1fr_1fr_100px] gap-4 px-4 py-2 border-b border-[#735c00]/20">
              {['Report', 'Format', 'Date', ''].map((h, i) => (
                <span key={i} className="font-mono text-[10px] text-[#504440] uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {RECENT_EXPORTS.map((e, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_100px] gap-4 px-4 py-3 border-b border-[#735c00]/10 hover:bg-[#f4e0bb]/30 transition-colors">
                <span className="font-crimson text-sm text-[#2c1810] font-semibold">{e.name}</span>
                <span className="font-crimson text-xs text-[#504440]">{e.type}</span>
                <span className="font-mono text-xs text-[#504440]">{e.date}</span>
                <button className="text-[#735c00] hover:text-[#2c1810] transition-colors">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  )
}
