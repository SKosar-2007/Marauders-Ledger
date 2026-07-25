import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SHORTCUTS = [
  { key: '⌘ K', desc: 'Open command palette' },
  { key: '⌘ /', desc: 'Toggle this help' },
  { key: '⌘ D', desc: 'Go to dashboard' },
  { key: '⌘ L', desc: 'Go to ledger' },
  { key: '⌘ P', desc: 'Go to profile' },
  { key: '⌘ U', desc: 'Upload transaction' },
  { key: 'Esc', desc: 'Close modal / panel' },
]

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === '/') { e.preventDefault(); setOpen((o) => !o) }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      {/* Floating trigger */}
      <button onClick={() => setOpen(true)}
        className="fixed bottom-5 right-20 z-[200] w-9 h-9 rounded-full bg-[#faf3e6] border border-[#735c00]/20 shadow-md flex items-center justify-center hover:bg-[#f4e0bb] transition-colors no-print"
        title="Keyboard shortcuts (⌘/)">
        <span className="material-symbols-outlined text-[18px] text-[#735c00]">keyboard</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#faf3e6] rounded-xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-[#735c00]/10 flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-[#735c00]">keyboard</span>
                <h2 className="font-cinzel text-sm text-[#2c1810]">Keyboard Shortcuts</h2>
                <button onClick={() => setOpen(false)} className="ml-auto text-[#504440] hover:text-[#2c1810]">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="p-4 space-y-1">
                {SHORTCUTS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-2 border-b border-[#735c00]/5 last:border-0">
                    <span className="font-crimson text-sm text-[#504440]">{s.desc}</span>
                    <kbd className="font-mono text-xs bg-white border border-[#735c00]/15 rounded px-2 py-0.5 text-[#735c00] shadow-sm">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
