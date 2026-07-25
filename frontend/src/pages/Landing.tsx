import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'
import { useUploadAndAnalyze } from '../hooks/useAnomalies'
import Header from '../components/Header'
import Footer from '../components/Footer'
import UploadZone from '../components/UploadZone'

export default function Landing() {
  const navigate = useNavigate()
  const { setBatchId } = useAppContext()
  const uploadMutation = useUploadAndAnalyze()

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadMutation.mutateAsync(file)
      setBatchId(result.batch_id)
      navigate('/dashboard')
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="w-full pt-20 px-4 lg:px-10 max-w-[1200px] mx-auto">
        <div className="flex flex-col w-full relative min-h-[80vh] items-center justify-center py-20">
          {/* Radial glow */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, #e9c349 0%, transparent 70%)' }} />

          {/* Title section */}
          <div className="text-center z-10 max-w-[800px] w-full flex flex-col items-center gap-6 mb-16 relative">
            {/* Spinning compass */}
            <div className="absolute -top-12 -left-12 w-32 h-32 opacity-20 pointer-events-none">
              <svg className="w-full h-full text-[#735c00]" style={{ animation: 'spin 60s linear infinite' }} fill="currentColor" viewBox="0 0 100 100">
                <path d="M50 0 C60 30 70 40 100 50 C70 60 60 70 50 100 C40 70 30 60 0 50 C30 40 40 30 50 0Z" />
              </svg>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-cinzel text-4xl md:text-5xl text-[#2c1810] tracking-widest uppercase drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] relative"
            >
              The Marauder's Ledger
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-[#735c00] to-transparent blur-sm" />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-cinzel text-xl text-[#735c00] italic tracking-tighter opacity-90 relative"
            >
              "I solemnly swear that I am up to no good."
              <span className="absolute -right-8 -bottom-4 text-[#504440] font-crimson text-xs tracking-[0.2em] transform rotate-[-15deg] opacity-50">
                ~ Moony
              </span>
            </motion.p>
          </div>

          {/* Upload zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-2xl z-10 px-4"
          >
            <UploadZone
              onFileUpload={handleFileUpload}
              isLoading={uploadMutation.isPending}
            />

            {uploadMutation.isError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center font-crimson text-sm text-[#dc2626]"
              >
                The spell failed. Please check your CSV format.
              </motion.p>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  // Load sample data - upload the compromised.csv from public
                  fetch('/sample.csv')
                    .then((r) => r.blob())
                    .then((blob) => {
                      const file = new File([blob], 'sample.csv', { type: 'text/csv' })
                      handleFileUpload(file)
                    })
                    .catch(() => {
                      // If sample not available, just navigate to dashboard
                      navigate('/dashboard')
                    })
                }}
                className="inline-flex items-center gap-2 font-crimson text-sm text-[#735c00] hover:text-[#2c1810] transition-colors group"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:rotate-180 transition-transform duration-700">
                  history_edu
                </span>
                <span className="border-b border-[#735c00]/30 group-hover:border-[#2c1810]/50 pb-0.5">
                  Load Sample Cursed Ledger
                </span>
              </button>
            </div>
          </motion.div>

          {/* Recent Investigations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="w-full mt-32 max-w-[1200px] z-10 px-4 lg:px-0"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#735c00]/30 to-[#735c00]/30" />
              <h2 className="font-cinzel text-sm text-[#2c1810] tracking-widest uppercase">
                Recent Investigations
              </h2>
              <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent via-[#735c00]/30 to-[#735c00]/30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  date: 'JUL 25, 2026',
                  title: "Godric's Hollow Expenses",
                  desc: 'Anomalous spike in protective charm material costs noted prior to incident.',
                  severity: 'high',
                },
                {
                  date: 'JUL 24, 2026',
                  title: "Zonko's Bulk Order",
                  desc: 'Quarterly audit of dungbomb acquisitions for term commencement.',
                  severity: 'medium',
                },
                {
                  date: 'JUL 23, 2026',
                  title: 'Three Broomsticks Tab',
                  desc: 'Outstanding butterbeer ledger reconciliation required by Madam Rosmerta.',
                  severity: 'low',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="group relative bg-[#faf3e6] p-8 parchment-edge shadow-[0_8px_30px_rgba(44,24,16,0.05)] hover:-translate-y-2 transition-all duration-500"
                >
                  <div className="absolute top-0 left-6 w-[2px] h-full bg-[#dc2626]/20 mix-blend-multiply" />
                  <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.2)] pointer-events-none" />
                  <div className="relative z-10 pl-4 flex flex-col h-full gap-4">
                    <div className="flex justify-between items-start">
                      <span className="font-crimson text-xs text-[#504440]">{item.date}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        item.severity === 'high' ? 'bg-red-50' : item.severity === 'medium' ? 'bg-amber-50' : 'bg-stone-50'
                      }`}>
                        <span className={`material-symbols-outlined text-[14px] ${
                          item.severity === 'high' ? 'text-red-700' : item.severity === 'medium' ? 'text-amber-700' : 'text-stone-600'
                        }`}>
                          {item.severity === 'high' ? 'warning' : item.severity === 'medium' ? 'visibility' : 'receipt_long'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-crimson text-base font-semibold text-[#2c1810] mb-1">{item.title}</h4>
                      <p className="font-crimson text-sm text-[#504440] line-clamp-2">{item.desc}</p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-[#f4e0bb] flex items-center justify-between">
                      <span className="font-crimson text-xs text-[#735c00] uppercase">View Scroll</span>
                      <span className="material-symbols-outlined text-[#735c00] text-[18px] group-hover:translate-x-1 transition-transform">
                        arrow_right_alt
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
