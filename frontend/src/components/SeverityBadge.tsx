import { SEVERITY_CONFIG, type Severity } from '../types'

interface SeverityBadgeProps {
  severity: Severity
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.none

  return (
    <span className={`font-crimson text-xs uppercase px-2 py-1 rounded ${config.color} ${config.bg}`}>
      Severity: {config.label}
    </span>
  )
}
