import { motion } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'

const SKILLS = [
  { label: 'Goblin Relations', level: 85 },
  { label: 'Potion Brewing', level: 72 },
  { label: 'Transfiguration', level: 68 },
  { label: 'Charms', level: 90 },
  { label: 'Defense Against Dark Arts', level: 78 },
]

const RECENT_CASES = [
  { title: 'Gringotts Exchange Anomaly', status: 'investigating', date: 'Jul 24, 2026' },
  { title: 'Honeydukes Purchase Pattern', status: 'resolved', date: 'Jul 22, 2026' },
  { title: 'Owl Post Charges Review', status: 'resolved', date: 'Jul 20, 2026' },
]

export default function Profile() {
  return (
    <div className="min-h-screen ml-[72px]">
      <Header />
      <main className="w-full pt-16 px-4 lg:px-10 max-w-[1200px] mx-auto pb-24">
        <div className="py-8">
          <h1 className="font-cinzel text-2xl text-[#2c1810] mb-1">Wizard's Dossier</h1>
          <p className="font-crimson text-sm text-[#504440] italic">Your official profile at the Ministry of Magic</p>
        </div>

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#f4e0bb] rounded-xl p-8 mb-6 parchment-edge shadow-md overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-[#735c00]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[#735c00]/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[32px] text-[#735c00]">person</span>
            </div>
            <div className="flex-1">
              <h2 className="font-cinzel text-2xl text-[#2c1810] mb-1">Harry J. Potter</h2>
              <p className="font-crimson text-sm text-[#504440]">Vault #713 — Hogwarts Alumni</p>
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
            <button className="bg-[#735c00] text-white hover:bg-[#5a4a00] transition-all px-4 py-2 rounded-full flex items-center gap-2 text-sm font-crimson">
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Profile
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Cases Investigated', value: '23', icon: 'search' },
            { label: 'Mischief Detected', value: '17', icon: 'bug_report' },
            { label: 'Accuracy Rate', value: '94%', icon: 'precision_manufacturing' },
            { label: 'Reports Generated', value: '41', icon: 'description' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#faf3e6] rounded-xl p-5 shadow-md text-center">
              <span className="material-symbols-outlined text-[24px] text-[#735c00] mb-2 block">{stat.icon}</span>
              <div className="font-mono text-xs text-[#504440] mb-1">{stat.label}</div>
              <div className="font-cinzel text-xl text-[#2c1810]">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Wizarding Skills</h3>
            <div className="space-y-4">
              {SKILLS.map((skill, i) => (
                <div key={skill.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-crimson text-sm text-[#2c1810]">{skill.label}</span>
                    <span className="font-mono text-xs text-[#504440]">{skill.level}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#735c00]/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${skill.level}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                      className="h-full bg-[#735c00] rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Cases */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#faf3e6] rounded-xl p-6 shadow-md">
            <h3 className="font-cinzel text-sm text-[#2c1810] mb-6 uppercase tracking-widest">Recent Cases</h3>
            <div className="space-y-3">
              {RECENT_CASES.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-[#f4e0bb]/50 transition-colors cursor-pointer">
                  <div>
                    <div className="font-crimson text-sm text-[#2c1810] font-semibold">{c.title}</div>
                    <div className="font-mono text-[10px] text-[#504440]">{c.date}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-crimson text-xs ${
                    c.status === 'investigating' ? 'bg-[#dc2626]/10 text-[#dc2626]' : 'bg-[#2d6a4f]/10 text-[#2d6a4f]'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
