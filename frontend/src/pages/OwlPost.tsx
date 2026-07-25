import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SeverityBadge from '../components/SeverityBadge'
import { useAnomalies } from '../hooks/useAnomalies'

export default function OwlPost() {
  const navigate = useNavigate()
  const { data: anomalies = [] } = useAnomalies()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const notifications = anomalies.map((a: any, i: number) => ({
    id: a.anomaly_id,
    title: a.severity === 'high' ? 'Dementor Alert' : a.severity === 'medium' ? 'Boggart Warning' : 'Peeves Notice',
    body: `Anomaly detected at ${a.merchant}. ${a.severity === 'high' ? 'Immediate review recommended.' : 'Pattern matches known issues.'}`,
    time: a.detected_at ? new Date(a.detected_at).toLocaleDateString() : 'Unknown',
    severity: a.severity,
    read: i > 2,
    merchant: a.merchant,
  }))

  const unreadCount = notifications.filter((n) => !n.read).length
  const filtered = notifications
    .filter((n) => filter === 'all' || !n.read)
    .filter((n) => search === '' || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8 flex items-center justify-between relative">
          <div>
            <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">Owl Post Office</h1>
            <p className="font-crimson text-sm text-[#504440] italic">Your alerts and notifications arrive by owl.</p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-[#dc2626] text-white rounded-full font-mono text-xs">{unreadCount} unread</span>
            )}
          </div>
          <span className="material-symbols-outlined text-[40px] text-[#735c00]/10 absolute -top-2 right-0 rotate-12">feather</span>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#735c00] text-[20px]">search</span>
            <input type="text" placeholder="Search dispatches..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-transparent border-b-2 border-[#735c00]/30 focus:border-[#735c00] outline-none font-crimson text-sm text-[#2c1810] transition-colors" />
          </div>
          <div className="flex gap-2">
            {(['all', 'unread'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full font-crimson text-sm transition-all ${
                  filter === f ? 'bg-[#735c00] text-white' : 'bg-[#f4e0bb] text-[#504440] hover:bg-[#735c00]/10'
                }`}>{f === 'all' ? 'All Owls' : 'Unread'}</button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <span className="material-symbols-outlined text-[48px] text-[#735c00]/30">mail</span>
              <p className="font-crimson text-sm text-[#504440]">No dispatches found.</p>
            </div>
          ) : (
            filtered.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ delay: i * 0.08 }}
                className={`relative bg-[#faf3e6] rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  !n.read ? 'ring-2 ring-[#735c00]/30' : ''
                }`} onClick={() => navigate(`/anomaly/${n.id}`)}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    n.severity === 'high' ? 'bg-[#dc2626]/10' : n.severity === 'medium' ? 'bg-[#d4af37]/10' : 'bg-[#2d6a4f]/10'
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] ${
                      n.severity === 'high' ? 'text-[#dc2626]' : n.severity === 'medium' ? 'text-[#d4af37]' : 'text-[#2d6a4f]'
                    }`}>
                      {n.severity === 'high' ? 'warning' : n.severity === 'medium' ? 'info' : 'check_circle'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-cinzel text-sm text-[#2c1810]">{n.title}</h3>
                      <span className="font-mono text-[10px] text-[#504440]">{n.time}</span>
                    </div>
                    <p className="font-crimson text-sm text-[#504440] mb-2">{n.body}</p>
                    <SeverityBadge severity={n.severity} />
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-[#735c00] rounded-full mt-2 flex-shrink-0 animate-pulse" />}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
