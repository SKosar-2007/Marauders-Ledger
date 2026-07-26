export default function Vault() {
  const metrics = [
    { label: 'Liquid Cap', value: '$42.8M', change: '+12.4% vs Prev Quarter', icon: 'account_balance', accent: 'bg-tertiary-fixed' },
    { label: 'Digital Securities', value: '18.2M', change: '+3.2% Yield', icon: 'security', accent: 'bg-secondary-container', bg: 'bg-secondary-container' },
    { label: 'Gold Reserves', value: '12,450 oz', change: 'Stable', icon: 'hexagon', accent: 'bg-tertiary-fixed-dim' },
    { label: 'Audit Status', value: 'Compliant', change: 'Last: 24m ago', icon: 'fact_check', accent: 'bg-tertiary-fixed', bg: 'bg-tertiary-fixed/10' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-gutter border-b-[3px] border-primary pb-gutter mb-gutter">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-widest border-l-[3px] border-primary pl-3">Asset Division</span>
            <h1 className="font-display text-5xl font-bold text-primary uppercase leading-none">Vault Reserves</h1>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 border-[3px] border-primary bg-secondary-fixed text-on-secondary-fixed font-mono text-xs uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">download</span> Export Ledger
            </button>
            <button className="px-6 py-3 border-[3px] border-primary bg-primary text-on-primary font-mono text-xs uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-tertiary-fixed hover:text-on-tertiary-fixed transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span> Allocate Funds
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {metrics.map((m) => (
            <div key={m.label} className={`border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col group hover:-translate-y-1 transition-transform ${m.bg || ''}`}>
              <div className="bg-primary text-on-primary p-3 border-b-[3px] border-primary flex justify-between items-center">
                <span className="font-display text-lg font-bold uppercase">{m.label}</span>
                <span className={`font-mono text-[10px] ${m.accent} text-on-tertiary-fixed px-2 py-1 border-[3px] border-primary`}>Live</span>
              </div>
              <div className="p-6 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-[120px]">{m.icon}</span>
                </div>
                <span className="font-display text-5xl font-bold tracking-tighter text-primary">{m.value}</span>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t-2 border-dashed border-primary/30">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim">arrow_upward</span>
                  <span className="font-mono text-sm text-primary">{m.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
