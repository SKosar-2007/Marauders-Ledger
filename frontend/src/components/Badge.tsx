interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

const VARIANT_CLASSES = {
  default: 'bg-[#735c00]/10 text-[#735c00]',
  success: 'bg-[#2d6a4f]/10 text-[#2d6a4f]',
  warning: 'bg-[#d4af37]/10 text-[#d4af37]',
  danger: 'bg-[#dc2626]/10 text-[#dc2626]',
  info: 'bg-[#504440]/10 text-[#504440]',
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
}

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-crimson ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`}>
      {children}
    </span>
  )
}
