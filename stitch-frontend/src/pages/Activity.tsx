export default function Activity() {
  const events = [
    { time: '14:02:42', label: 'T-minus 3s', title: 'Large Value Transfer', desc: 'Outgoing transfer of 4,200 ETH to address 0x8F...B2 approved via multi-sig.', tag: 'SECURITY', color: 'border-error bg-error/10', dot: 'bg-error' },
    { time: '14:02:30', label: 'T-minus 15s', title: 'New Peer Synced', desc: 'Node [AP-EAST-03] completed initial sync (1,024 blocks). Network topology updated.', tag: 'NETWORK', color: 'border-tertiary-fixed bg-tertiary-fixed/10', dot: 'bg-tertiary-fixed' },
    { time: '14:01:55', label: 'T-minus 50s', title: 'Batch Reconciliation', desc: 'Batch #8812 reconciled. 892/892 transactions verified. Zero discrepancies.', tag: 'SYSTEM', color: 'border-primary bg-surface', dot: 'bg-primary' },
    { time: '14:01:20', label: 'T-minus 85s', title: 'Anomaly Flagged', desc: 'Tx #A-4421: Amount exceeds 3σ threshold. Category: High-Value Transfer. Pending review.', tag: 'SECURITY', color: 'border-error bg-error/10', dot: 'bg-error' },
    { time: '14:00:45', label: 'T-minus 2m', title: 'Routine Health Check', desc: 'All 24 nodes operational. Avg latency: 12ms. No alerts.', tag: 'SYSTEM', color: 'border-primary bg-surface', dot: 'bg-primary' },
  ]

  return (
    <div className="p-8 relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="max-w-[1440px] mx-auto relative z-10">
        <div className="mb-12 border-b-[3px] border-primary pb-6 flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase text-surface-tint tracking-widest bg-secondary-fixed text-on-secondary-fixed w-fit px-2 py-1 border-[2px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2">SYSTEM_LOG // LIVE</span>
            <h1 className="font-display text-5xl font-bold text-primary mt-4 uppercase">Activity Feed</h1>
            <p className="font-body text-base text-on-surface-variant max-w-2xl mt-2">Real-time monitoring of ledger entries, security anomalies, and high-value transfers across all system cores.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] uppercase text-on-surface-variant">System Status</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 bg-tertiary-fixed border-[2px] border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse" />
                <span className="font-mono text-sm font-bold text-primary">NOMINAL</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] uppercase text-on-surface-variant">Last Refresh</span>
              <span className="font-mono text-sm text-primary mt-1">14:02:45 UTC</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-surface-container border-[3px] border-primary p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-12">
          <div className="flex gap-4 items-center">
            <span className="font-mono text-xs uppercase text-on-surface">Filter By:</span>
            {['All Events', 'Security', 'Transfers', 'System'].map((f) => (
              <button key={f} className={`font-mono text-xs uppercase px-4 py-2 border-[2px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all ${f === 'All Events' ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-secondary-fixed hover:text-on-secondary-fixed'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full max-w-5xl mx-auto">
          <div className="absolute left-8 top-0 bottom-0 w-[3px] bg-primary" />
          <div className="flex flex-col gap-12">
            {events.map((evt, i) => (
              <div key={i} className="relative flex gap-8 group">
                <div className={`absolute left-8 -translate-x-1/2 top-6 w-5 h-5 ${evt.dot} border-[3px] border-primary z-10 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:scale-125 transition-transform`} />
                <div className="w-32 flex flex-col items-end pt-4 pr-16 text-right shrink-0 relative z-20">
                  <span className="font-mono text-sm font-bold text-primary bg-surface px-2 border-[2px] border-primary inline-block">{evt.time}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase mt-1 block">{evt.label}</span>
                </div>
                <div className={`flex-1 border-[3px] border-primary p-6 ${evt.color} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all relative`}>
                  <div className="absolute -left-[3px] top-0 bottom-0 w-2" />
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`font-mono text-[10px] uppercase px-2 py-0.5 border-[2px] border-primary ${evt.tag === 'SECURITY' ? 'bg-error text-on-error' : evt.tag === 'NETWORK' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container text-on-surface'}`}>{evt.tag}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-primary uppercase tracking-tight mb-2">{evt.title}</h3>
                  <p className="font-body text-sm text-on-surface-variant">{evt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
