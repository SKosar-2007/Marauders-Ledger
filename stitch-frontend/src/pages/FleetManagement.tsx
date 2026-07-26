export default function FleetManagement() {
  const dispatches = [
    { id: '#F-421', node: 'AP-EAST-03', type: 'Data Sync', status: 'In Transit', eta: '2m 14s', priority: 'High', color: 'border-error bg-error/10' },
    { id: '#F-420', node: 'US-WEST-01', type: 'Reconciliation', status: 'Queued', eta: '5m 00s', priority: 'Normal', color: 'border-tertiary-fixed bg-tertiary-fixed/10' },
    { id: '#F-419', node: 'EU-CENTRAL-02', type: 'Config Update', status: 'Delivered', eta: '–', priority: 'Low', color: 'border-primary bg-surface' },
    { id: '#F-418', node: 'LATAM-01', type: 'Emergency Patch', status: 'In Transit', eta: '1m 30s', priority: 'Critical', color: 'border-error bg-error/10' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-10 pb-4 border-b-[3px] border-primary flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase text-surface-tint tracking-widest bg-secondary-fixed text-on-secondary-fixed w-fit px-2 py-1 border-[2px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1">DISPATCH // LIVE</span>
            <h1 className="font-display text-5xl font-bold text-primary uppercase mt-2">Fleet Command</h1>
            <p className="font-body text-base text-on-surface-variant max-w-2xl">Orchestrate and monitor data payload dispatch across the global node network.</p>
          </div>
          <div className="flex gap-4">
            <div className="border-[3px] border-primary bg-surface-container-lowest p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
              <span className="font-mono text-[10px] uppercase text-on-surface-variant">Active Nodes</span>
              <span className="font-display text-2xl font-bold text-primary">12/24</span>
            </div>
            <div className="border-[3px] border-primary bg-surface-container-lowest p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
              <span className="font-mono text-[10px] uppercase text-on-surface-variant">Avg Latency</span>
              <span className="font-display text-2xl font-bold text-tertiary-fixed">42ms</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-gutter">
          <div className="lg:col-span-7 border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-primary px-6 py-3 border-b-[3px] border-primary flex justify-between items-center">
              <h2 className="font-display text-base font-bold text-on-primary uppercase">Network Topology</h2>
              <span className="font-mono text-[10px] text-on-primary uppercase border-[2px] border-on-primary px-2">Live</span>
            </div>
            <div className="p-6 h-72 bg-surface-container relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(0,251,251,0.1),transparent_50%),radial-gradient(circle_at_80%_30%,rgba(252,212,0,0.08),transparent_50%)]" />
              <div className="relative z-10 grid grid-cols-4 gap-4 h-full">
                {[20, 40, 60, 80].map((_cy, i) => (
                  <div key={i} className="flex flex-col justify-between items-center py-4">
                    <div className="w-full h-[2px] bg-primary/20 relative">
                      <div className="absolute -top-1.5 w-3 h-3 bg-primary border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ left: `${i * 25}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant mt-2">Node {String.fromCharCode(65 + i)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold uppercase border-b-[3px] border-primary pb-2">Silo Capacity</h2>
            {[
              { label: 'Core Data', used: 78, total: 128, color: 'bg-secondary-container' },
              { label: 'Replication', used: 45, total: 64, color: 'bg-tertiary-fixed' },
              { label: 'Archive', used: 112, total: 256, color: 'bg-primary' },
            ].map((silo) => (
              <div key={silo.label} className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-xs uppercase">
                  <span className="text-on-surface">{silo.label}</span>
                  <span className="text-on-surface-variant">{silo.used}TB / {silo.total}TB</span>
                </div>
                <div className="w-full h-3 border-[2px] border-primary bg-surface-container-higher">
                  <div className={`h-full ${silo.color} border-r-[2px] border-primary`} style={{ width: `${(silo.used / silo.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-primary px-6 py-3 border-b-[3px] border-primary flex justify-between items-center">
            <h2 className="font-display text-base font-bold text-on-primary uppercase">Active Dispatches</h2>
            <button className="px-4 py-1 border-[2px] border-on-primary text-on-primary font-mono text-xs uppercase hover:bg-on-primary hover:text-primary transition-colors">New Dispatch</button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b-[2px] border-primary/20 bg-surface-container font-mono text-[10px] uppercase text-on-surface">
                <div className="col-span-1">ID</div>
                <div className="col-span-2">Node</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">ETA</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-1"></div>
              </div>
              {dispatches.map((d, i) => (
                <div key={i} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-primary/10 hover:bg-surface-container-low transition-colors items-center ${d.priority === 'Critical' ? 'bg-error/5' : ''}`}>
                  <div className="col-span-1 font-mono text-xs text-primary font-bold">{d.id}</div>
                  <div className="col-span-2 font-mono text-xs">{d.node}</div>
                  <div className="col-span-2 font-body text-sm">{d.type}</div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 border-[2px] border-primary font-mono text-[10px] uppercase ${d.status === 'In Transit' ? 'bg-secondary-container text-on-secondary-container' : d.status === 'Delivered' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container text-on-surface'}`}>{d.status}</span>
                  </div>
                  <div className="col-span-2 font-mono text-xs text-on-surface-variant">{d.eta}</div>
                  <div className="col-span-2">
                    <span className={`font-mono text-[10px] uppercase ${d.priority === 'Critical' ? 'text-error' : d.priority === 'High' ? 'text-secondary-container' : 'text-on-surface-variant'}`}>{d.priority}</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button className="px-3 py-1 border-[2px] border-primary font-mono text-[10px] uppercase hover:bg-primary hover:text-on-primary transition-colors">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
