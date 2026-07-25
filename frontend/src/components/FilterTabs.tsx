interface FilterTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const TABS = [
  { id: 'all', label: 'Prongs' },
  { id: 'Food', label: 'Moony' },
  { id: 'Shopping', label: 'Wormtail' },
  { id: 'Bills', label: 'Padfoot' },
]

export default function FilterTabs({ activeTab, onTabChange }: FilterTabsProps) {
  return (
    <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-full font-crimson text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-[#735c00] text-white shadow-sm'
              : 'bg-transparent text-[#735c00] border-2 border-[#735c00]/30 hover:border-[#735c00] hover:bg-[#735c00]/5'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
