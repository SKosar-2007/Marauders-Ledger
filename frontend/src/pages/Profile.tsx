import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProgressRing from '../components/ProgressRing'
import { useAnomalies } from '../hooks/useAnomalies'
import { useSpendingByCategory } from '../hooks/useSpending'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: anomalies = [] } = useAnomalies()
  const { data: categoryData = [] } = useSpendingByCategory()

  const totalSpent = categoryData.reduce((sum, c) => sum + c.total, 0)
  const highCount = anomalies.filter((a) => a.severity === 'high').length

  const stats = [
    { label: 'Cases Investigated', value: String(anomalies.length), icon: 'search' },
    { label: 'Mischief Detected', value: String(highCount), icon: 'bug_report' },
    { label: 'Accuracy Rate', value: anomalies.length > 0 ? `${Math.round(((anomalies.length - highCount) / anomalies.length) * 100)}%` : '—', icon: 'precision_manufacturing' },
    { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: 'description' },
  ]

  const recentCases = anomalies.slice(0, 5).map((a) => ({
    title: `${a.merchant} Anomaly`,
    status: a.severity === 'high' ? 'investigating' : 'resolved',
    date: a.detected_at ? new Date(a.detected_at).toLocaleDateString() : '—',
    id: a.anomaly_id,
  }))

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">Wizard's Dossier</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Your official profile at the Ministry of Magic</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#f4e0bb] rounded-xl p-8 mb-6 parchment-edge shadow-md overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-[#735c00]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-24 h-24">
                <defs>
                  <linearGradient id="avatar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#735c00' }} />
                    <stop offset="100%" style={{ stopColor: '#d4af37' }} />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill="url(#avatar-grad)" opacity="0.15" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="url(#avatar-grad)" strokeWidth="2" />
                <path d="M50 15 L35 45 L65 45 Z" fill="#2c1810" opacity="0.8" />
                <ellipse cx="50" cy="45" rx="18" ry="4" fill="#2c1810" opacity="0.6" />
                <circle cx="50" cy="28" r="3" fill="#d4af37" />
                <circle cx="50" cy="58" r="12" fill="#f5e6c8" />
                <circle cx="46" cy="56" r="1.5" fill="#2c1810" />
                <circle cx="54" cy="56" r="1.5" fill="#2c1810" />
                <path d="M47 62 Q50 65 53 62" fill="none" stroke="#2c1810" strokeWidth="1" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-cinzel text-2xl text-[#2c1810] mb-1">{user?.name || 'Wizard'}</h2>
              <p className="font-crimson text-sm text-[#504440]">{user?.email || 'Unknown'}</p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#735c00]">school</span>
                  <span className="font-crimson text-xs text-[#504440]">Gryffindor House</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#735c00]">workspace_premium</span>
                  <span className="font-crimson text-xs text-[#504440]">Auror</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#735c00]">calendar_today</span>
                  <span className="font-crimson text-xs text-[#504440]">Member since Jul 2026</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-5 shadow-md text-center">
              <span className="material-symbols-outlined text-[24px] text-[#735c00] mb-2 block">{stat.icon}</span>
              <div className="font-mono text-xs text-[#504440] mb-1">{stat.label}</div>
              <div className="font-cinzel text-xl text-[#2c1810]">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Spending by Category</h3>
            <div className="grid grid-cols-3 gap-6">
              {categoryData.slice(0, 3).map((cat) => (
                <div key={cat.category} className="flex flex-col items-center">
                  <ProgressRing value={totalSpent > 0 ? Math.round((cat.total / totalSpent) * 100) : 0} size={72} strokeWidth={4} color="#735c00" />
                  <span className="font-crimson text-xs text-[#2c1810] mt-3 text-center">{cat.category}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Recent Cases</h3>
            <div className="space-y-3">
              {recentCases.length === 0 ? (
                <p className="font-crimson text-sm text-[#504440] text-center py-4">No cases yet. Upload a ledger to begin.</p>
              ) : (
                recentCases.map((c, i) => (
                  <div key={i} onClick={() => navigate(`/anomaly/${c.id}`)}
                    className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-[#f4e0bb]/50 transition-colors cursor-pointer">
                    <div>
                      <div className="font-crimson text-sm text-[#2c1810] font-semibold">{c.title}</div>
                      <div className="font-mono text-[10px] text-[#504440]">{c.date}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-crimson text-xs ${
                      c.status === 'investigating' ? 'bg-[#dc2626]/10 text-[#dc2626]' : 'bg-[#2d6a4f]/10 text-[#2d6a4f]'
                    }`}>{c.status}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
