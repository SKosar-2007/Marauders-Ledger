import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', onConfirm, onCancel,
}: ConfirmDialogProps) {
  const colors = {
    danger: { bg: 'bg-[#dc2626]', hover: 'hover:bg-[#dc2626]/80' },
    warning: { bg: 'bg-[#d4af37]', hover: 'hover:bg-[#d4af37]/80' },
    info: { bg: 'bg-[#735c00]', hover: 'hover:bg-[#5a4a00]' },
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200]" onClick={onCancel} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] bg-[#faf3e6] rounded-xl shadow-2xl z-[201] p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={`material-symbols-outlined text-[24px] ${
                variant === 'danger' ? 'text-[#dc2626]' : variant === 'warning' ? 'text-[#d4af37]' : 'text-[#735c00]'
              }`}>
                {variant === 'danger' ? 'error' : variant === 'warning' ? 'warning' : 'info'}
              </span>
              <h3 className="font-cinzel text-lg text-[#2c1810]">{title}</h3>
            </div>
            <p className="font-crimson text-sm text-[#504440] mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={onCancel}
                className="px-4 py-2 font-crimson text-sm text-[#504440] hover:text-[#2c1810] border border-[#735c00]/20 rounded-lg transition-colors">
                {cancelLabel}
              </button>
              <button onClick={onConfirm}
                className={`px-4 py-2 font-crimson text-sm text-white rounded-lg transition-colors ${colors[variant].bg} ${colors[variant].hover}`}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
