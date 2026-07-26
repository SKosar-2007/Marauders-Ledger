import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }
interface ToastCtx { addToast: (m: string, t?: Toast['type']) => void }

const ToastContext = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++idRef.current
    setToasts((p) => [...p, { id, message, type }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000)
  }, [])
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`border-[3px] border-primary px-4 py-3 font-mono text-sm uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
            t.type === 'error' ? 'bg-error-container text-on-error-container' :
            t.type === 'success' ? 'bg-secondary-container text-on-secondary-container' :
            'bg-surface-container-lowest text-on-surface'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
