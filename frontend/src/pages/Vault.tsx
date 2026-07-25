import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SeverityBadge from '../components/SeverityBadge'
import { useAnomalies } from '../hooks/useAnomalies'
import { useSpendingByCategory } from '../hooks/useSpending'

export default function Vault() {
  const navigate = useNavigate()
  const { data: anomalies = [] } = useAnomalies()
  const { data: spendingData = [] } = useSpendingByCategory()

  const totalBalance = spendingData.reduce((sum, s) => sum + s.total, 0)
  const totalTxns = anomalies.length
  const flaggedCount = anomalies.filter((a) => a.severity === 'high').length

  const VAULT_STATS = [
    { label: 'Total Spent', value: `₹${totalBalance.toLocaleString()}`, icon: 'account_balance', change: `${spendingData.length} categories`, positive: true },
    { label: 'Anomalies', value: String(totalTxns), icon: 'trending_up', change: `${flaggedCount} high severity`, positive: flaggedCount === 0 },
    { label: 'Transactions', value: String(anomalies.length), icon: 'receipt_long', change: `${flaggedCount} flagged`, positive: flaggedCount === 0 },
    { label: 'Categories', value: String(spendingData.length), icon: 'savings', change: 'Active categories', positive: true },
  ]

  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Vault</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Gringotts Bank Statement — Full Account Overview</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#1a1a2e] rounded-xl p-8 mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#735c00]/10 to-transparent" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="font-mono text-[10px] text-[#d4af37] uppercase tracking-[0.3em] block mb-2">Gringotts Wizarding Bank</span>
              <h2 className="font-cinzel text-3xl text-[#d4af37] mb-2">Account Summary</h2>
              <p className="font-crimson text-sm text-[#9ca3af]">Your Financial Vault</p>
            </div>
            <div className="text-left md:text-right">
              <span className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-1">Total Spent</span>
              <div className="font-cinzel text-4xl text-[#d4af37]">₹{totalBalance.toLocaleString()}</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {VAULT_STATS.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-5 shadow-md hover:shadow-lg transition-all group">
              <span className="material-symbols-outlined text-[24px] text-[#735c00] group-hover:text-[#d4af37] transition-colors mb-2 block">{stat.icon}</span>
              <div className="font-mono text-xs text-[#504440] mb-1">{stat.label}</div>
              <div className="font-cinzel text-xl text-[#2c1810] mb-2">{stat.value}</div>
              <div className={`font-crimson text-xs ${stat.positive ? 'text-[#2d6a4f]' : 'text-[#dc2626]'}`}>{stat.change}</div>
            </motion.div>
          ))}
        </div>

        <div className="bg-[#faf3e6] rounded-xl shadow-md overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#735c00] to-[#735c00]/30" />
          <div className="grid grid-cols-[1fr_2fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-[#735c00]/20">
            {['Category', 'Total Spent', '', '', ''].map((h, i) => (
              <span key={i} className="font-mono text-[10px] text-[#504440] uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {spendingData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="material-symbols-outlined text-[32px] text-[#735c00]/30">account_balance</span>
              <p className="font-crimson text-sm text-[#504440]">No transactions yet. Upload a ledger to begin.</p>
            </div>
          ) : (
            spendingData.map((item, i) => (
              <motion.div key={item.category} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[1fr_2fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-[#735c00]/10 hover:bg-[#f4e0bb]/30 transition-colors">
                <span className="font-crimson text-sm text-[#2c1810] font-semibold">{item.category}</span>
                <span className="font-mono text-xs text-[#2c1810]">₹{item.total.toLocaleString()}</span>
                <span className="font-crimson text-xs text-[#504440]">{((item.total / totalBalance) * 100).toFixed(1)}%</span>
                <span></span>
                <span></span>
              </motion.div>
            ))
          )}
        </div>

        {anomalies.length > 0 && (
          <div className="mt-8 bg-[#faf3e6] rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-3 border-b border-[#735c00]/20">
              <h3 className="font-cinzel text-sm text-[#2c1810] uppercase tracking-widest">Recent Anomalies</h3>
            </div>
            {anomalies.slice(0, 5).map((a, i) => (
              <motion.div key={a.anomaly_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[1fr_2fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-[#735c00]/10 hover:bg-[#dc2626]/5 cursor-pointer transition-colors"
                onClick={() => navigate(`/anomaly/${a.anomaly_id}`)}>
                <span className="font-mono text-xs text-[#504440]">{a.category}</span>
                <span className="font-crimson text-sm text-[#2c1810] font-semibold flex items-center gap-2">
                  {a.merchant}
                  <span className="material-symbols-outlined text-[14px] text-[#dc2626]">warning</span>
                </span>
                <SeverityBadge severity={a.severity} />
                <span className="font-mono text-xs text-[#dc2626]">₹{a.amount.toLocaleString()}</span>
                <button className="text-[#735c00] hover:text-[#2c1810] transition-colors">
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
