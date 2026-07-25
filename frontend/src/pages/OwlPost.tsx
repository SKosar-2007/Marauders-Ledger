import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SeverityBadge from '../components/SeverityBadge'

const NOTIFICATIONS = [
  { id: 1, title: 'Dementor Alert', body: 'Unusual transaction detected at Gringotts Exchange. Immediate review recommended.', time: '2 hours ago', severity: 'high', read: false },
  { id: 2, title: 'Boggart Warning', body: 'Spending at Madam Malkin\'s exceeds your typical pattern by 40%.', time: '5 hours ago', severity: 'medium', read: false },
  { id: 3, title: 'Weekly Report', body: 'Your weekly financial summary is ready. 3 incidents flagged.', time: '1 day ago', severity: 'low', read: true },
  { id: 4, title: 'Peeves Notice', body: 'Minor anomaly detected in Owl Post charges. Pattern matches known issues.', time: '2 days ago', severity: 'low', read: true },
  { id: 5, title: 'Mischief Confirmed', body: 'Gringotts Exchange transaction has been confirmed as suspicious activity.', time: '3 days ago', severity: 'high', read: true },
]

export default function OwlPost() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS)

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  const markRead = (id: number) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8 flex items-center justify-between">
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
        </div>

        <div className="space-y-4">
          {notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
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
                {!n.read && <div className="w-2 h-2 bg-[#735c00] rounded-full mt-2 flex-shrink-0" />}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
