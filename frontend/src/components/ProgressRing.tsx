import { motion } from 'framer-motion'

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  showValue?: boolean
}

export default function ProgressRing({
  value, size = 64, strokeWidth = 3, color = '#735c00', label, showValue = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#735c0020" strokeWidth={strokeWidth} />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }} />
      </svg>
      {showValue && (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[#2c1810]">
          {Math.round(value)}%
        </span>
      )}
      {label && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-crimson text-[10px] text-[#504440] whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}
