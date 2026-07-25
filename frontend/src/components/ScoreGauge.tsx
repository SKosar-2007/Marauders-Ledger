import { motion } from 'framer-motion'

interface ScoreGaugeProps {
  score: number
  label: string
  color?: string
  description?: string
}

export default function ScoreGauge({ score, label, color = '#735c00', description }: ScoreGaugeProps) {
  const percentage = Math.round(score * 100)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score * circumference)

  return (
    <div className="bg-[#faf3e6] p-6 rounded-lg flex flex-col items-center justify-center relative parchment-edge">
      <div className="absolute inset-0 rounded-lg pointer-events-none shadow-[inset_1px_1px_0_rgba(212,175,55,0.1)]" />
      <span className="font-crimson text-xs text-[#504440] uppercase tracking-widest mb-4">{label}</span>
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle className="stroke-[#d3c3be]/30" cx="50" cy="50" fill="none" r="45" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" fill="none" r="45" strokeWidth="8"
            stroke={color} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="font-crimson text-2xl font-bold" style={{ color }}>{percentage}%</span>
        </div>
      </div>
      {description && (
        <p className="font-crimson text-xs text-[#504440] mt-3 text-center italic">{description}</p>
      )}
    </div>
  )
}
