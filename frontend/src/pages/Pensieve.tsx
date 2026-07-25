import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SpendChart from '../components/SpendChart'
import SeverityBadge from '../components/SeverityBadge'

const INSIGHTS = [
  { icon: 'insights', title: 'Spending Patterns', text: 'Your heaviest spending occurs on Sundays — consistent with Quidditch match day purchases.' },
  { icon: 'psychology', title: 'Behavioral Analysis', text: 'Transactions spike after full moons, suggesting late-night Hogsmeade visits.' },
  { icon: 'flag', title: 'Risk Factors', text: '2 vendors flagged across 3 transactions. Gringotts Exchange shows unusual activity.' },
]

const TOP_CATEGORIES = [
  { name: 'Food & Drink', amount: '₹12,400', pct: 34, icon: 'restaurant' },
  { name: 'Shopping', amount: '₹8,200', pct: 22, icon: 'shopping_bag' },
  { name: 'Bills & Fees', amount: '₹7,800', pct: 21, icon: 'receipt' },
  { name: 'Entertainment', amount: '₹5,100', pct: 14, icon: 'movie' },
  { name: 'Travel', amount: '₹3,200', pct: 9, icon: 'flight' },
]

export default function Pensieve() {
  const [timeRange, setTimeRange] = useState('6m')

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Pensieve</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Deep dive analysis — where the truth reveals itself</p>
        </div>

        {/* Time Filter */}
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

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md mb-8">
          <SpendChart />
        </motion.div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {INSIGHTS.map((insight, i) => (
            <motion.div key={insight.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-[24px] text-[#735c00] mb-3 block">{insight.icon}</span>
              <h3 className="font-cinzel text-sm text-[#2c1810] mb-2">{insight.title}</h3>
              <p className="font-crimson text-sm text-[#504440]">{insight.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Top Categories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Spending Categories</h3>
          <div className="space-y-4">
            {TOP_CATEGORIES.map((cat, i) => (
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

        {/* Risk Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-8 bg-[#faf3e6] rounded-xl p-6 shadow-md">
          <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Mischief Risk Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Dementor', count: 3, color: 'bg-[#dc2626]', severity: 'high' },
              { label: 'Boggart', count: 5, color: 'bg-[#d4af37]', severity: 'medium' },
              { label: 'Peeves', count: 12, color: 'bg-[#2d6a4f]', severity: 'low' },
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
      </main>
      <Footer />
    </div>
  )
}
