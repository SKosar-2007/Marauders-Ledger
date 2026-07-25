import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

const TRANSACTIONS = [
  { date: '2026-07-25', merchant: 'Honeydukes', amount: 420, category: 'Food', anomaly: false },
  { date: '2026-07-24', merchant: 'Madam Malkin\'s', amount: 1200, category: 'Shopping', anomaly: false },
  { date: '2026-07-24', merchant: 'Gringotts Exchange', amount: 15000, category: 'Bills', anomaly: true },
  { date: '2026-07-23', merchant: 'Zonko\'s Joke Shop', amount: 350, category: 'Shopping', anomaly: false },
  { date: '2026-07-22', merchant: 'The Leaky Cauldron', amount: 680, category: 'Food', anomaly: false },
  { date: '2026-07-21', merchant: 'Ministry of Magic', amount: 2500, category: 'Bills', anomaly: false },
  { date: '2026-07-20', merchant: 'Owl Post Office', amount: 150, category: 'Bills', anomaly: false },
  { date: '2026-07-20', merchant: 'Unknown Vault 713', amount: 8400, category: 'Bills', anomaly: true },
]

const VAULT_STATS = [
  { label: 'Total Balance', value: '₹124,350', icon: 'account_balance', change: '+₹2,400 this month', positive: true },
  { label: 'Highest Spent', value: '₹15,000', icon: 'trending_up', change: 'Gringotts Exchange — Suspicious', positive: false },
  { label: 'Transactions', value: '47', icon: 'receipt_long', change: '12 flagged for review', positive: false },
  { label: 'Galleons Saved', value: '₹8,200', icon: 'savings', change: 'Compared to last month', positive: true },
]

export default function Vault() {
  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">The Vault</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Gringotts Bank Statement — Full Account Overview</p>
        </div>

        {/* Vault Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#1a1a2e] rounded-xl p-8 mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#735c00]/10 to-transparent" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="font-mono text-[10px] text-[#d4af37] uppercase tracking-[0.3em] block mb-2">Gringotts Wizarding Bank</span>
              <h2 className="font-cinzel text-3xl text-[#d4af37] mb-2">Account Summary</h2>
              <p className="font-crimson text-sm text-[#9ca3af]">Vault #713 — Harry J. Potter</p>
            </div>
            <div className="text-left md:text-right">
              <span className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-1">Current Balance</span>
              <div className="font-cinzel text-4xl text-[#d4af37]">₹124,350</div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
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

        {/* Transactions Table */}
        <div className="bg-[#faf3e6] rounded-xl shadow-md overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#735c00] to-[#735c00]/30" />
          <div className="grid grid-cols-[1fr_2fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-[#735c00]/20">
            {['Date', 'Merchant', 'Category', 'Amount', ''].map((h) => (
              <span key={h} className="font-mono text-[10px] text-[#504440] uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {TRANSACTIONS.map((txn, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`grid grid-cols-[1fr_2fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-[#735c00]/10 transition-colors ${
                txn.anomaly ? 'bg-[#dc2626]/5 hover:bg-[#dc2626]/10' : 'hover:bg-[#f4e0bb]/30'
              }`}>
              <span className="font-mono text-xs text-[#504440]">{txn.date}</span>
              <span className="font-crimson text-sm text-[#2c1810] font-semibold flex items-center gap-2">
                {txn.merchant}
                {txn.anomaly && <span className="material-symbols-outlined text-[14px] text-[#dc2626]">warning</span>}
              </span>
              <span className="font-crimson text-xs text-[#504440]">{txn.category}</span>
              <span className={`font-mono text-xs ${txn.anomaly ? 'text-[#dc2626] font-semibold' : 'text-[#2c1810]'}`}>
                ₹{txn.amount.toLocaleString()}
              </span>
              <button className="text-[#735c00] hover:text-[#2c1810] transition-colors">
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </button>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
