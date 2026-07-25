interface StatusDotProps {
  status: 'active' | 'inactive' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

const STATUS_COLORS = {
  active: 'bg-[#2d6a4f]',
  inactive: 'bg-[#504440]/30',
  warning: 'bg-[#d4af37]',
  error: 'bg-[#dc2626]',
}

const SIZE_CLASSES = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
}

export default function StatusDot({ status, size = 'sm', pulse }: StatusDotProps) {
  return (
    <span className={`inline-flex items-center justify-center`}>
      <span className={`rounded-full ${STATUS_COLORS[status]} ${SIZE_CLASSES[size]} ${
        (pulse || status === 'error') ? 'animate-pulse' : ''
      }`} />
    </span>
  )
}
