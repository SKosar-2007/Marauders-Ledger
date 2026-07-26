export default function AccessControl() {
  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-4 border-b-[3px] border-primary">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-5xl font-bold text-primary uppercase">Access Control</h1>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase text-on-surface-variant bg-surface-container px-3 py-1 border-[3px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">System Critical</span>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant px-2 border-[2px] border-outline">Zone 4: High-Sec</span>
            </div>
          </div>
          <button className="mt-6 md:mt-0 px-6 py-3 bg-secondary-container text-primary border-[3px] border-primary font-display text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            Escalate
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-lowest border-[3px] border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-error -mr-8 -mt-8 rotate-45 group-hover:scale-110 transition-transform" />
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase text-primary mb-1">Global Override</span>
                  <h2 className="font-display text-2xl font-bold text-primary uppercase leading-none">Lockdown</h2>
                </div>
                <span className="material-symbols-outlined text-4xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-8">Initiate total facility lockdown. Revokes all active sessions and seals designated bulkheads.</p>
              <div className="flex items-center justify-between border-t-[3px] border-primary pt-4">
                <span className="font-mono text-sm text-primary uppercase">Status: <span className="text-on-tertiary-fixed bg-tertiary-fixed px-2 border-[2px] border-primary">Standby</span></span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-16 h-8 bg-surface-container border-[3px] border-primary peer-checked:bg-error after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-primary after:border-[3px] after:border-primary after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>

            <div className="bg-surface-container-lowest border-[3px] border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-3xl text-primary">block</span>
                <h2 className="font-display text-lg font-bold text-primary uppercase">Revoke Access</h2>
              </div>
              <div className="relative w-full">
                <span className="absolute -top-3 left-4 bg-surface-container-lowest px-1 font-mono text-[10px] uppercase text-primary border-[2px] border-primary z-10">Target ID</span>
                <input className="w-full bg-surface-container-lowest border-[3px] border-primary p-4 font-mono text-sm text-primary uppercase placeholder:text-on-surface-variant/50 focus:outline-none focus:bg-surface-container" placeholder="e.g. USR-992-X" />
              </div>
              <button className="w-full py-4 mt-2 bg-primary text-on-primary border-[3px] border-primary font-display text-sm uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-error transition-colors">
                Execute Purge
              </button>
            </div>

            <div className="bg-surface-container-lowest border-[3px] border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase text-on-surface-variant">Grid Integrity</span>
                <span className="font-mono text-sm text-primary uppercase">Nominal</span>
              </div>
              <div className="w-12 h-12 bg-primary border-[3px] border-primary flex items-center justify-center">
                <div className="w-6 h-6 bg-tertiary-fixed-dim animate-pulse" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-surface-container-lowest border-[3px] border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-primary px-6 py-3 border-b-[3px] border-primary flex justify-between items-center">
                <h2 className="font-display text-base font-bold text-on-primary uppercase">Intervention Telemetry</h2>
                <span className="font-mono text-[10px] text-on-primary uppercase border-[2px] border-on-primary px-2">Last 24H</span>
              </div>
              <div className="p-6 relative h-64 w-full bg-surface-container">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#000" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#000" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#000" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                  <polygon fill="#000" opacity="0.1" points="0,100 0,60 20,40 40,80 60,30 80,50 100,20 100,100" />
                  <polyline fill="none" points="0,60 20,40 40,80 60,30 80,50 100,20" stroke="#000" strokeWidth="1.5" />
                  <polyline fill="none" points="0,80 20,70 40,90 60,60 80,75 100,40" stroke="#00fbfb" strokeWidth="2" />
                  <line x1="0" y1="35" x2="100" y2="35" stroke="#fcd400" strokeWidth="1.5" />
                  <rect x="0" y="31" width="15" height="8" fill="#fcd400" />
                  <text x="2" y="37" fill="#000" fontFamily="JetBrains Mono" fontSize="4" fontWeight="bold">CRIT</text>
                </svg>
              </div>
            </div>

            <div className="bg-surface-container-lowest border-[3px] border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="bg-primary px-6 py-3 border-b-[3px] border-primary flex justify-between items-center">
                <h2 className="font-display text-base font-bold text-on-primary uppercase">Override Log</h2>
                <span className="material-symbols-outlined text-on-primary">list_alt</span>
              </div>
              <div className="overflow-auto">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b-[2px] border-primary/20 bg-surface-container font-mono text-[10px] uppercase text-primary">
                  <div className="col-span-3">Timestamp</div>
                  <div className="col-span-2">Actor</div>
                  <div className="col-span-5">Action</div>
                  <div className="col-span-2 text-right">Result</div>
                </div>
                {[
                  { time: '2024.10.27_14:32:01', actor: 'ADM-X9', action: 'Force_Close_Bulkhead_B', result: 'EXEC', resultColor: 'bg-primary text-on-primary' },
                  { time: '2024.10.27_13:15:44', actor: 'SYS_AUTO', action: 'Revoke_Token_USR-442', result: 'FAIL', resultColor: 'bg-error text-on-error' },
                  { time: '2024.10.27_09:00:12', actor: 'ADM-V2', action: 'Escalate_Privilege_Z4', result: 'WARN', resultColor: 'bg-secondary-container text-primary' },
                  { time: '2024.10.26_23:59:59', actor: 'SYS_MAINT', action: 'Routine_Key_Rotation', result: 'EXEC', resultColor: 'bg-primary text-on-primary' },
                ].map((entry, i) => (
                  <div key={i} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-primary/10 hover:bg-surface-container-low transition-colors items-center ${entry.result === 'FAIL' ? 'bg-error/5' : ''}`}>
                    <div className="col-span-3 font-mono text-xs text-on-surface-variant">{entry.time}</div>
                    <div className={`col-span-2 font-mono text-xs font-bold ${entry.result === 'FAIL' ? 'text-error' : 'text-primary'}`}>{entry.actor}</div>
                    <div className={`col-span-5 font-body text-sm ${entry.result === 'FAIL' ? 'text-error font-bold' : 'text-primary'}`}>{entry.action}</div>
                    <div className="col-span-2 text-right">
                      <span className={`inline-block px-2 py-1 font-mono text-[10px] uppercase border-[2px] border-primary ${entry.resultColor}`}>{entry.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
