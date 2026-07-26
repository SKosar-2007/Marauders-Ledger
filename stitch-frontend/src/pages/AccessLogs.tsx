export default function AccessLogs() {
  const logs = [
    { id: 1, identity: 'Evelyn.Vance', uid: 'USR-884A-991B', time: '2023.10.27_14:23:01', ip: '192.168.1.44', loc: 'Seattle, WA', resource: '/api/v1/core-sys', status: 'SUCCESS' },
    { id: 2, identity: 'Marcus.T', uid: 'USR-102C-445X', time: '2023.10.27_14:21:45', ip: '45.22.109.8', loc: 'London, UK', resource: '/admin/vault_acc', status: 'MFA_CHALLENGE' },
    { id: 3, identity: 'UNKNOWN_ENTITY', uid: 'NULL', time: '2023.10.27_14:20:11', ip: '185.10.20.100', loc: 'Unknown Origin', resource: '/db/master_keys', status: 'FAILED' },
    { id: 4, identity: 'SysAdmin_01', uid: 'ADM-001A-001A', time: '2023.10.27_14:15:22', ip: '10.0.0.1', loc: 'Internal Net', resource: '/sys/kernel_update', status: 'SUCCESS' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-[3px] border-primary pb-6 mb-8 gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase text-surface-tint tracking-widest bg-surface-container text-on-surface w-fit px-2 py-1 border-[2px] border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">SEC-OPS UNIT</span>
            <h1 className="font-display text-5xl font-bold text-primary uppercase leading-none tracking-tighter mt-2">Identity Audit</h1>
            <p className="font-body text-base text-on-surface-variant max-w-lg mt-2">Real-time access logs and authentication events. Monitoring terminal grid for unauthorized incursions.</p>
          </div>
          <div className="border-[3px] border-primary bg-surface-container-lowest p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant">System Status</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 bg-secondary-container border-[2px] border-primary animate-pulse" />
              <span className="font-mono text-sm font-bold text-primary">MONITORING</span>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-4 border-b-[3px] border-primary mb-8">
          <div className="relative w-full md:w-1/2">
            <span className="absolute -top-3 left-3 bg-surface px-1 font-mono text-[10px] uppercase border-[2px] border-primary z-10">SEARCH_QUERY</span>
            <div className="flex items-center border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <span className="material-symbols-outlined pl-3 text-primary">search</span>
              <input className="w-full bg-transparent font-mono text-sm p-3 outline-none placeholder:text-on-surface-variant" placeholder="Enter User ID, IP, or Event ID..." />
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <span className="absolute -top-3 left-3 bg-surface px-1 font-mono text-[10px] uppercase border-[2px] border-primary z-10">FILTER: STATUS</span>
              <select className="w-full appearance-none border-[3px] border-primary bg-surface-container-lowest p-3 font-mono text-sm outline-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                <option>ALL EVENTS</option>
                <option>SUCCESS</option>
                <option>FAILED</option>
                <option>MFA_CHALLENGE</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">arrow_drop_down</span>
            </div>
            <button className="bg-primary text-on-primary border-[3px] border-primary p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-inverse-surface transition-all flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>refresh</span>
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-12 gap-0 border-b-[3px] border-primary bg-surface-container-high font-mono text-[10px] uppercase text-primary">
              <div className="col-span-1 p-3 border-r-[3px] border-primary flex items-center justify-center">SYS_ID</div>
              <div className="col-span-3 p-3 border-r-[3px] border-primary">IDENTITY</div>
              <div className="col-span-2 p-3 border-r-[3px] border-primary">TIMESTAMP (UTC)</div>
              <div className="col-span-2 p-3 border-r-[3px] border-primary">LOCATION / IP</div>
              <div className="col-span-2 p-3 border-r-[3px] border-primary">RESOURCE</div>
              <div className="col-span-2 p-3 flex items-center justify-center">STATUS</div>
            </div>
            {logs.map((log) => (
              <div key={log.id} className={`grid grid-cols-12 gap-0 border-b border-primary hover:bg-surface-container-lowest transition-colors group cursor-crosshair ${log.status === 'FAILED' ? 'bg-error-container/20' : ''}`}>
                <div className={`col-span-1 p-3 border-r-[3px] border-primary font-mono text-xs flex items-center justify-center ${log.status === 'FAILED' ? 'bg-error text-on-error' : 'bg-surface text-on-surface group-hover:bg-primary group-hover:text-on-primary'} transition-colors`}>
                  {log.id.toString().padStart(3, '0')}
                </div>
                <div className="col-span-3 p-3 border-r-[3px] border-primary flex items-center gap-3">
                  <div className={`w-8 h-8 border-[2px] border-primary flex-shrink-0 flex items-center justify-center ${log.status === 'FAILED' ? 'bg-error' : 'bg-surface-container-highest'}`}>
                    <span className="material-symbols-outlined text-sm">{log.status === 'FAILED' ? 'person_off' : 'person'}</span>
                  </div>
                  <div className="flex flex-col truncate">
                    <span className={`font-display text-sm font-bold truncate ${log.status === 'FAILED' ? 'text-error' : 'text-on-surface'}`}>{log.identity}</span>
                    <span className="font-mono text-[11px] text-on-surface-variant truncate">ID: {log.uid}</span>
                  </div>
                </div>
                <div className={`col-span-2 p-3 border-r-[3px] border-primary font-mono text-xs flex items-center ${log.status === 'FAILED' ? 'text-error font-bold' : 'text-on-surface-variant'}`}>{log.time}</div>
                <div className={`col-span-2 p-3 border-r-[3px] border-primary flex flex-col justify-center ${log.status === 'FAILED' ? 'text-error' : ''}`}>
                  <span className="font-mono text-xs truncate">{log.ip}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase truncate">{log.loc}</span>
                </div>
                <div className={`col-span-2 p-3 border-r-[3px] border-primary font-mono text-xs flex items-center truncate ${log.status === 'FAILED' ? 'text-error font-bold' : ''}`}>{log.resource}</div>
                <div className="col-span-2 p-3 flex items-center justify-center">
                  <div className={`border-[2px] border-primary px-2 py-1 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    log.status === 'SUCCESS' ? 'bg-primary text-on-primary' :
                    log.status === 'MFA_CHALLENGE' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-error text-on-error animate-pulse'
                  }`}>
                    {log.status === 'MFA_CHALLENGE' && <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shield_locked</span>}
                    {log.status === 'FAILED' && <span className="material-symbols-outlined text-sm">close</span>}
                    {log.status === 'SUCCESS' && <div className="w-2 h-2 bg-on-primary" />}
                    <span>{log.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="flex justify-between items-center border-t-[3px] border-primary pt-4 mt-8">
          <span className="font-mono text-xs text-on-surface-variant">DISPLAYING <span className="text-primary font-bold">1-4</span> OF <span className="text-primary font-bold">8,492</span> LOGS</span>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-container transition-all disabled:opacity-50" disabled>
              <span className="material-symbols-outlined font-bold">chevron_left</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center border-[3px] border-primary bg-primary text-on-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-inverse-surface transition-all">
              <span className="material-symbols-outlined font-bold">chevron_right</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
