import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SeverityBadge from '../components/SeverityBadge'
import type { Severity } from '../types'

const NOTIFICATIONS: { id: number; title: string; body: string; time: string; severity: Severity; read: boolean }[] = [
  { id: 1, title: 'Dementor Alert', body: 'Unusual transaction detected at Gringotts Exchange. Immediate review recommended.', time: '2 hours ago', severity: 'high', read: false },
  { id: 2, title: 'Boggart Warning', body: 'Spending at Madam Malkin\'s exceeds your typical pattern by 40%.', time: '5 hours ago', severity: 'medium', read: false },
  { id: 3, title: 'Weekly Report', body: 'Your weekly financial summary is ready. 3 incidents flagged.', time: '1 day ago', severity: 'low', read: true },
  { id: 4, title: 'Peeves Notice', body: 'Minor anomaly detected in Owl Post charges. Pattern matches known issues.', time: '2 days ago', severity: 'low', read: true },
  { id: 5, title: 'Mischief Confirmed', body: 'Gringotts Exchange transaction has been confirmed as suspicious activity.', time: '3 days ago', severity: 'high', read: true },
]

const FLIGHTS = [
  { owl: 'Errol', from: 'Gringotts', to: 'Hogwarts', progress: 85, eta: '12 min', status: 'in-flight' },
  { owl: 'Pigwidgeon', from: 'Ministry', to: 'Hogsmeade', progress: 45, eta: '28 min', status: 'in-flight' },
  { owl: 'Hedwig', from: 'Hogwarts', to: 'Godric\'s Hollow', progress: 100, eta: 'Delivered', status: 'delivered' },
]

export default function OwlPost() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  const markRead = (id: number) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))

  const unreadCount = notifications.filter((n) => !n.read).length
  const filtered = notifications
    .filter((n) => filter === 'all' || !n.read)
    .filter((n) => search === '' || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        {/* Header with feather decoration */}
        <div className="py-8 flex items-center justify-between relative">
          <div>
            <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">Owl Post Office</h1>
            <p className="font-crimson text-sm text-[#504440] italic">Your alerts and notifications arrive by owl.</p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-[#dc2626] text-white rounded-full font-mono text-xs">{unreadCount} unread</span>
            )}
            <button onClick={markAllRead}
              className="font-crimson text-sm text-[#735c00] hover:text-[#2c1810] underline decoration-[#735c00]/50 underline-offset-4 transition-colors">
              Mark all as read
            </button>
          </div>
          <span className="material-symbols-outlined text-[40px] text-[#735c00]/10 absolute -top-2 right-0 rotate-12">feather</span>
        </div>

        {/* In-Flight Tracker */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-8 torn-edge">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-4 uppercase tracking-widest">In-Flight Owls</h3>
          <div className="space-y-3">
            {FLIGHTS.map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white/50 rounded-lg">
                <span className="material-symbols-outlined text-[18px] text-[#735c00]">pets</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-crimson text-sm text-[#2c1810] font-semibold">{f.owl}</span>
                    <span className="font-mono text-[10px] text-[#504440]">{f.eta}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-crimson text-xs text-[#504440]">{f.from}</span>
                    <span className="material-symbols-outlined text-[12px] text-[#735c00]">arrow_right_alt</span>
                    <span className="font-crimson text-xs text-[#504440]">{f.to}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#735c00]/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${f.progress}%` }}
                      transition={{ delay: 0.3 + i * 0.2, duration: 1 }}
                      className={`h-full rounded-full ${f.progress === 100 ? 'bg-[#2d6a4f]' : 'bg-[#735c00]'}`} />
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-crimson text-[10px] ${
                  f.status === 'delivered' ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]' : 'bg-[#735c00]/10 text-[#735c00]'
                }`}>{f.status}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Search & Filter */}
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

        {/* Notifications */}
        <div className="space-y-4">
          {filtered.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ delay: i * 0.08 }}
              className={`relative bg-[#faf3e6] rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                !n.read ? 'ring-2 ring-[#735c00]/30' : ''
              }`} onClick={() => markRead(n.id)}>
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
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
