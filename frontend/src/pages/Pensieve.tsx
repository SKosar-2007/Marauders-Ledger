import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SpendChart from '../components/SpendChart'
import SeverityBadge from '../components/SeverityBadge'
import { useAnomalies } from '../hooks/useAnomalies'
import { useSpendingByDay, useSpendingByCategory } from '../hooks/useSpending'

export default function Pensieve() {
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState('6m')
  const { data: anomalies = [] } = useAnomalies()
  const { data: spendingData = [] } = useSpendingByDay()
  const { data: categoryData = [] } = useSpendingByCategory()

  const chartData = spendingData.length > 0
    ? spendingData.map((d) => ({ day: `Day ${d.day}`, amount: d.amount }))
    : [{ day: 'Mon', amount: 120 }, { day: 'Tue', amount: 85 }, { day: 'Wed', amount: 200, hasAnomaly: true },
       { day: 'Thu', amount: 95 }, { day: 'Fri', amount: 150 }, { day: 'Sat', amount: 300, hasAnomaly: true },
       { day: 'Sun', amount: 180 }]

  const highCount = anomalies.filter((a) => a.severity === 'high').length
  const medCount = anomalies.filter((a) => a.severity === 'medium').length
  const lowCount = anomalies.filter((a) => a.severity === 'low').length

  const totalSpent = categoryData.reduce((sum, c) => sum + c.total, 0)

  const topCategories = categoryData
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({
      name: c.category,
      amount: `₹${c.total.toLocaleString()}`,
      pct: totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0,
      icon: c.category === 'Food' ? 'restaurant' : c.category === 'Shopping' ? 'shopping_bag' : c.category === 'Bills' ? 'receipt' : c.category === 'Entertainment' ? 'movie' : 'flight',
    }))

  const insights = [
    { icon: 'insights', title: 'Spending Patterns', text: `You have ${anomalies.length} anomalies across ${categoryData.length} categories.` },
    { icon: 'psychology', title: 'Behavioral Analysis', text: `${highCount} high-severity incidents require immediate attention.` },
    { icon: 'flag', title: 'Risk Factors', text: `${anomalies.filter((a) => a.severity !== 'low').length} vendors flagged across recent transactions.` },
  ]

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Pensieve</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Deep dive analysis — where the truth reveals itself</p>
        </div>

        <div className="flex gap-2 mb-8">
          {['1m', '3m', '6m', '1y', 'all'].map((t) => (
            <button key={t} onClick={() => setTimeRange(t)}
              className={`px-4 py-2 rounded-full font-crimson text-sm transition-all ${
                timeRange === t
                  ? 'bg-[#735c00] text-white shadow-md'
                  : 'bg-[#f4e0bb] text-[#504440] hover:bg-[#735c00]/10'
              }`}>
              {t === 'all' ? 'All Time' : t.toUpperCase()}
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-8">
          <SpendChart data={chartData} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {insights.map((insight, i) => (
            <motion.div key={insight.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-[24px] text-[#735c00] mb-3 block">{insight.icon}</span>
              <h3 className="font-cinzel text-sm text-[#2c1810] mb-2">{insight.title}</h3>
              <p className="font-crimson text-sm text-[#504440]">{insight.text}</p>
            </motion.div>
          ))}
        </div>

        {topCategories.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-8">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Spending Categories</h3>
            <div className="space-y-4">
              {topCategories.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[18px] text-[#735c00]">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-crimson text-sm text-[#2c1810]">{cat.name}</span>
                      <span className="font-mono text-xs text-[#504440]">{cat.amount}</span>
                    </div>
                    <div className="w-full h-2 bg-[#735c00]/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.pct}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                        className="h-full bg-[#735c00] rounded-full"
                      />
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#504440] w-10 text-right">{cat.pct}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-8 bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Mischief Risk Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Dementor', count: highCount, color: 'bg-[#dc2626]', severity: 'high' as const },
              { label: 'Boggart', count: medCount, color: 'bg-[#d4af37]', severity: 'medium' as const },
              { label: 'Peeves', count: lowCount, color: 'bg-[#2d6a4f]', severity: 'low' as const },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <div className="flex-1">
                  <div className="font-crimson text-sm text-[#2c1810]">{item.label}</div>
                  <div className="font-mono text-lg text-[#735c00]">{item.count}</div>
                </div>
                <SeverityBadge severity={item.severity} />
              </div>
            ))}
          </div>
        </motion.div>

        {anomalies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-8 bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Recent Anomalies</h3>
            <div className="space-y-2">
              {anomalies.slice(0, 5).map((a) => (
                <div key={a.anomaly_id}
                  onClick={() => navigate(`/anomaly/${a.anomaly_id}`)}
                  className="flex items-center gap-4 p-3 bg-white/50 rounded-lg hover:bg-[#f4e0bb]/50 cursor-pointer transition-colors">
                  <SeverityBadge severity={a.severity} />
                  <span className="font-crimson text-sm text-[#2c1810] flex-1">{a.merchant}</span>
                  <span className="font-mono text-xs text-[#dc2626]">₹{a.amount.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  )
}
