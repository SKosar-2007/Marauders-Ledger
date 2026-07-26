export default function Settings() {
  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between border-b-[3px] border-primary pb-4 mb-gutter">
          <div>
            <h1 className="font-display text-4xl font-bold text-primary uppercase tracking-tighter">Workspace Configuration</h1>
            <p className="font-mono text-xs text-on-surface-variant uppercase mt-2">Manage global environment variables and access controls</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 border-[3px] border-primary bg-secondary-container text-on-secondary-container font-mono text-xs uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">restart_alt</span> Reset Defaults
            </button>
            <button className="px-6 py-3 border-[3px] border-primary bg-primary text-on-primary font-mono text-xs uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">save</span> Commit Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-gutter">
          {/* UI Appearance */}
          <div className="col-span-12 lg:col-span-4 border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full">
            <div className="bg-primary text-on-primary p-4 border-b-[3px] border-primary flex justify-between items-center">
              <h2 className="font-display text-lg font-bold uppercase">UI Appearance</h2>
              <span className="material-symbols-outlined">palette</span>
            </div>
            <div className="p-6 flex flex-col gap-6 flex-1">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs uppercase text-on-surface">Select Environment Theme</span>
                <div className="grid grid-cols-2 gap-4">
                  <button className="group relative p-4 border-[3px] border-primary bg-white hover:bg-secondary-fixed transition-colors flex flex-col items-center gap-3">
                    <div className="w-16 h-16 border-[3px] border-primary bg-surface-container-low flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary scale-150">light_mode</span>
                    </div>
                    <span className="font-mono text-xs uppercase text-primary group-hover:text-on-secondary-fixed">Light</span>
                    <div className="absolute top-2 right-2 w-3 h-3 border-2 border-primary bg-secondary-container" />
                  </button>
                  <button className="group relative p-4 border-[3px] border-primary bg-primary text-on-primary hover:bg-tertiary-fixed transition-colors flex flex-col items-center gap-3">
                    <div className="w-16 h-16 border-[3px] border-primary bg-inverse-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary scale-150">dark_mode</span>
                    </div>
                    <span className="font-mono text-xs uppercase text-on-primary group-hover:text-on-tertiary-fixed">Dark</span>
                    <div className="absolute top-2 right-2 w-3 h-3 border-2 border-primary" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <span className="font-mono text-xs uppercase text-on-surface">Data Density</span>
                <select className="w-full bg-surface-container-low border-[3px] border-primary py-3 px-4 font-mono text-sm uppercase focus:outline-none focus:bg-secondary-fixed shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer appearance-none">
                  <option>Compact (High Density)</option>
                  <option>Standard (Readable)</option>
                  <option>Relaxed (Presentation)</option>
                </select>
              </div>
            </div>
          </div>

          {/* API Access Keys */}
          <div className="col-span-12 lg:col-span-8 border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <div className="bg-primary text-on-primary p-4 border-b-[3px] border-primary flex justify-between items-center">
              <h2 className="font-display text-lg font-bold uppercase">API Access Keys</h2>
              <button className="px-3 py-1 bg-secondary-container text-on-secondary-container border-2 border-primary font-mono text-[10px] uppercase hover:bg-white hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">add</span> Generate New Key
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse border-[3px] border-primary">
                <thead>
                  <tr className="bg-surface-container-highest border-b-[3px] border-primary">
                    <th className="p-3 font-mono text-xs uppercase text-on-surface border-r-[3px] border-primary w-48">Service Name</th>
                    <th className="p-3 font-mono text-xs uppercase text-on-surface border-r-[3px] border-primary">Token String</th>
                    <th className="p-3 font-mono text-xs uppercase text-on-surface border-r-[3px] border-primary w-32">Last Used</th>
                    <th className="p-3 font-mono text-xs uppercase text-on-surface w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Production Sync', token: 'pk_live_8f92j...49xk2', used: '12 Mins Ago' },
                    { name: 'Staging Environment', token: 'sk_test_3a21b...99mn1', used: '3 Days Ago', revoked: true },
                    { name: 'Analytics Read-Only', token: 'rk_live_5t67y...22qw8', used: 'Just Now' },
                  ].map((key) => (
                    <tr key={key.name} className="border-b-[3px] border-primary hover:bg-secondary-fixed transition-colors group">
                      <td className={`p-3 border-r-[3px] border-primary font-mono text-sm uppercase ${key.revoked ? 'text-on-surface-variant line-through' : ''}`}>{key.name}</td>
                      <td className={`p-3 border-r-[3px] border-primary font-mono text-sm bg-surface-container-low group-hover:bg-transparent ${key.revoked ? 'text-on-surface-variant' : ''}`}>{key.token}</td>
                      <td className={`p-3 border-r-[3px] border-primary font-mono text-sm ${key.revoked ? 'text-on-surface-variant' : ''}`}>{key.used}</td>
                      <td className="p-3 flex justify-center gap-2">
                        {key.revoked ? (
                          <button className="px-2 py-1 border-2 border-primary bg-surface-container font-mono text-[10px] uppercase">Revoked</button>
                        ) : (
                          <>
                            <button className="w-8 h-8 border-2 border-primary bg-white flex items-center justify-center hover:bg-tertiary-fixed"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>
                            <button className="w-8 h-8 border-2 border-primary bg-white flex items-center justify-center hover:bg-error hover:text-on-error"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-surface-container-low border-t-[3px] border-primary flex items-center gap-3">
              <span className="material-symbols-outlined text-error">warning</span>
              <span className="font-mono text-xs uppercase text-on-surface">Warning: Never expose secret keys in client-side code.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
