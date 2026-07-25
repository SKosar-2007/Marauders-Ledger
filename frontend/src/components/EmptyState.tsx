interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon = 'search_off', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#f4e0bb] flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px] text-[#735c00]">{icon}</span>
      </div>
      <p className="font-cinzel text-sm text-[#2c1810]">{title}</p>
      {description && <p className="font-crimson text-xs text-[#504440] max-w-[300px]">{description}</p>}
      {action && (
        <button onClick={action.onClick}
          className="mt-2 px-4 py-2 bg-[#735c00] text-white rounded-full font-crimson text-sm hover:bg-[#5a4a00] transition-colors">
          {action.label}
        </button>
      )}
    </div>
  )
}
