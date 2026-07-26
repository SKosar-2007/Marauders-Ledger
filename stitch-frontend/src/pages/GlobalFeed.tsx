export default function GlobalFeed() {
  const events = [
    { id: 1, type: 'event', time: '14:03:02', node: 'US-WEST-01', msg: 'Block #128,441 confirmed. 2,342 TXNs. 0.04s validation time.', tag: 'NETWORK', color: 'text-tertiary-fixed' },
    { id: 2, type: 'event', time: '14:02:58', node: 'AP-EAST-03', msg: 'Node sync complete. Height delta: 0 blocks.', tag: 'SYSTEM', color: 'text-primary' },
    { id: 3, type: 'alert', time: '14:02:45', node: 'LATAM-01', msg: 'Latency spike detected: 250ms (threshold: 150ms). Auto-scaling initiated.', tag: 'WARN', color: 'text-secondary-container' },
    { id: 4, type: 'event', time: '14:02:30', node: 'CORE', msg: 'Batch reconciliation #8812: 892/892 verified. Discrepancy rate: 0.00%.', tag: 'SYSTEM', color: 'text-primary' },
    { id: 5, type: 'event', time: '14:02:12', node: 'EU-CENTRAL-02', msg: 'New governance proposal submitted: SIP-0042 (Protocol Upgrade v3.1).', tag: 'GOV', color: 'text-tertiary-fixed' },
    { id: 6, type: 'alert', time: '14:01:55', node: 'SEC-ZONE', msg: 'Anomaly #A-4421: Amount exceeds 3 sigma threshold. Pending manual review.', tag: 'SECURITY', color: 'text-error' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-10 border-b-[3px] border-primary pb-6 flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase text-surface-tint tracking-widest bg-surface-container text-on-surface w-fit px-2 py-1 border-[2px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">NETWORK_HUB // LIVE</span>
            <h1 className="font-display text-5xl font-bold text-primary uppercase mt-2">Global Feed</h1>
            <p className="font-body text-base text-on-surface-variant max-w-2xl">Decentralized event stream spanning all nodes, protocols, and security perimeters.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-tertiary-fixed border-[2px] border-primary animate-pulse" />
            <span className="font-mono text-xs font-bold text-primary">2,847 EVENTS / 24H</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-primary px-6 py-3 border-b-[3px] border-primary flex justify-between items-center">
              <h2 className="font-display text-base font-bold text-on-primary uppercase">System Event Stream</h2>
              <div className="flex gap-2">
                {['All', 'Blocks', 'Alerts', 'Governance'].map((f) => (
                  <button key={f} className={`px-2 py-1 border-[2px] font-mono text-[10px] uppercase transition-colors ${f === 'All' ? 'border-on-primary text-on-primary bg-primary-fixed' : 'border-on-primary/50 text-on-primary/70 hover:border-on-primary hover:text-on-primary'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto space-y-2">
              {events.map((evt) => (
                <div key={evt.id} className={`flex items-start gap-4 p-4 border-[2px] border-primary bg-surface-container transition-colors hover:bg-surface-container-low cursor-pointer ${evt.type === 'alert' ? 'border-l-error border-l-4' : ''}`}>
                  <div className="flex flex-col items-center gap-1 w-20 shrink-0">
                    <span className="font-mono text-xs text-primary font-bold">{evt.time}</span>
                    <span className="font-mono text-[9px] text-on-surface-variant uppercase">{evt.node}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-on-surface">{evt.msg}</p>
                  </div>
                  <div className="shrink-0">
                    <span className={`font-mono text-[9px] uppercase px-2 py-0.5 border-[2px] border-primary ${evt.color.replace('text', 'bg').replace('tertiary-fixed', 'tertiary-fixed/20').replace('primary', 'primary/10').replace('secondary-container', 'secondary-container/20').replace('error', 'error/20')} ${evt.color}`}>{evt.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="font-display text-base font-bold uppercase mb-4 border-b-[3px] border-primary pb-2">Core Diagnostics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Block Height', value: '128,441' },
                  { label: 'TXN Pool', value: '2,342' },
                  { label: 'Avg Block Time', value: '0.04s' },
                  { label: 'Peer Count', value: '24/24' },
                ].map((d) => (
                  <div key={d.label} className="flex justify-between items-center">
                    <span className="font-mono text-[10px] uppercase text-on-surface-variant">{d.label}</span>
                    <span className="font-mono text-sm font-bold text-primary">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="font-display text-base font-bold uppercase mb-4 border-b-[3px] border-primary pb-2">Quick Actions</h3>
              <div className="space-y-3">
                {['Broadcast Message', 'Force Reconnect', 'Trigger Snapshot'].map((action) => (
                  <button key={action} className="w-full py-3 border-[3px] border-primary bg-surface-container font-mono text-xs uppercase hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors text-left px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none">
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
