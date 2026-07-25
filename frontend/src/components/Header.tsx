import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <header className="fixed top-0 w-full z-50 bg-[#f5e6c8]/90 backdrop-blur-sm shadow-[0_4px_12px_rgba(44,24,16,0.08)]">
      <div className="h-20 max-w-[1200px] mx-auto px-4 lg:px-10 flex items-center justify-between">
        <Link to="/" className="flex flex-col">
          <span className="font-cinzel text-lg tracking-widest text-[#2c1810] uppercase">
            The Marauder's Ledger
          </span>
          <span className="font-crimson text-xs text-[#735c00] italic -mt-1 tracking-tighter">
            I solemnly swear that I am up to no good
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className={`font-crimson text-sm transition-all px-2 py-1 ${
              isActive('/')
                ? 'text-[#735c00] border-b-2 border-[#735c00]'
                : 'text-[#504440] hover:text-[#735c00]'
            }`}
          >
            Landing
          </Link>
          <Link
            to="/dashboard"
            className={`font-crimson text-sm transition-all px-2 py-1 ${
              isActive('/dashboard')
                ? 'text-[#735c00] border-b-2 border-[#735c00]'
                : 'text-[#504440] hover:text-[#735c00]'
            }`}
          >
            Dashboard
          </Link>
          <div className="ml-4 w-8 h-8 rounded-full bg-[#2c1810] flex items-center justify-center">
            <span className="text-white text-sm material-symbols-outlined">person</span>
          </div>
        </nav>
      </div>
      <div className="h-1 bg-gradient-to-r from-transparent via-[#735c00] to-transparent relative">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#735c00] bg-[#f5e6c8] px-2 text-xs">
          ◈
        </span>
      </div>
    </header>
  )
}
