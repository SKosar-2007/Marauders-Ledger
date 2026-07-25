import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SeverityBadge from './SeverityBadge'
import type { AnomalyResult } from '../types'

interface AnomalyCardProps {
  anomaly: AnomalyResult
  index: number
}

const LOCATION_MAP: Record<string, string> = {
  Food: 'Hogwarts',
  Shopping: 'Hogsmeade',
  Bills: 'Gringotts',
  Entertainment: 'Diagon Alley',
  Travel: 'Platform 9¾',
}

const BORDER_COLORS: Record<string, string> = {
  high: 'border-l-[#dc2626]',
  medium: 'border-l-[#d4af37]',
  low: 'border-l-[#827470]',
  none: 'border-l-[#2d6a4f]',
}

export default function AnomalyCard({ anomaly, index }: AnomalyCardProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className={`bg-[#faf3e6] p-5 rounded-lg shadow-sm relative group cursor-pointer transition-all duration-500 hover:shadow-md hover:-translate-y-1 border-l-4 ${BORDER_COLORS[anomaly.severity] || BORDER_COLORS.none}`}
      onClick={() => navigate(`/anomaly/${anomaly.anomaly_id}`)}
    >
      <div className="absolute inset-0 rounded-lg pointer-events-none shadow-[inset_1px_1px_0_rgba(212,175,55,0.4)]" />

      <div className="flex justify-between items-start mb-3">
        <SeverityBadge severity={anomaly.severity} />
        <span className="font-crimson text-xs text-[#504440]">
          {anomaly.triggered_rules.length > 0
            ? anomaly.triggered_rules.join(', ')
            : `${anomaly.hour}:00`}
        </span>
      </div>

      <h3 className="font-crimson text-base font-semibold text-[#2c1810] mb-2">
        {anomaly.merchant}
      </h3>
      <p className="font-crimson text-sm text-[#504440] mb-4 line-clamp-2">
        {anomaly.triggered_rules.length > 0
          ? `Triggered: ${anomaly.triggered_rules.map(r => r.replace(/_/g, ' ')).join(', ')}`
          : `Transaction of ₹${anomaly.amount.toFixed(2)} in ${anomaly.category}`}
      </p>

      <div className="flex items-center justify-between border-t border-[#735c00]/20 pt-3">
        <span className="font-crimson text-xs text-[#735c00] flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          {LOCATION_MAP[anomaly.category] || anomaly.category}
        </span>
        <button className="font-crimson text-xs text-[#2c1810] hover:text-[#735c00] underline decoration-[#735c00]/50 underline-offset-4 transition-colors">
          Investigate
        </button>
      </div>
    </motion.div>
  )
}
