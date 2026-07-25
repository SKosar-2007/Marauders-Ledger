import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  { icon: 'upload_file', title: 'Upload Your Parchment', desc: 'Drag & drop your bank statement CSV onto the upload zone. The Map will analyze every transaction.' },
  { icon: 'map', title: 'The Map Reveals Mischief', desc: 'Suspicious transactions appear as colored dots on the Marauder\'s Map. Red means danger.' },
  { icon: 'touch_app', title: 'Investigate Anomalies', desc: 'Click any dot to see ML scores, AI narratives, and related transactions. Mark valid or confirm mischief.' },
  { icon: 'record_voice_over', title: 'The Map Speaks', desc: 'Listen to the AI narrate each anomaly in the voice of the Marauder\'s Map.' },
  { icon: 'download', title: 'Export Reports', desc: 'Download detailed PDF reports for any anomaly. Share with your team or keep for records.' },
]

const ONBOARD_KEY = 'marauders_onboarded'

export default function Onboarding() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const onboarded = localStorage.getItem(ONBOARD_KEY)
    if (!onboarded) setShow(true)
  }, [])

  const close = () => {
    localStorage.setItem(ONBOARD_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-[#faf3e6] rounded-2xl shadow-2xl overflow-hidden">
            {/* Progress dots */}
            <div className="flex justify-center gap-2 pt-6">
              {STEPS.map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? 'bg-[#735c00] w-6' : i < step ? 'bg-[#735c00]/40' : 'bg-[#735c00]/15'
                }`} />
              ))}
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#735c00]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-[#735c00]">{STEPS[step].icon}</span>
                  </div>
                  <h3 className="font-cinzel text-lg text-[#2c1810]">{STEPS[step].title}</h3>
                  <p className="font-crimson text-sm text-[#504440] leading-relaxed">{STEPS[step].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-8 pb-6">
              <button onClick={close} className="font-crimson text-sm text-[#504440] hover:text-[#2c1810] underline underline-offset-2">
                Skip Tour
              </button>
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep((s) => s + 1)}
                  className="px-6 py-2 bg-[#735c00] text-white rounded-full font-crimson text-sm hover:bg-[#5a4a00] transition-colors">
                  Next
                </button>
              ) : (
                <button onClick={close}
                  className="px-6 py-2 bg-[#735c00] text-white rounded-full font-crimson text-sm hover:bg-[#5a4a00] transition-colors">
                  Begin Investigation
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
