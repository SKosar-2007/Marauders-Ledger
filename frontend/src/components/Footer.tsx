export default function Footer() {
  return (
    <footer className="w-full mt-24 pb-12 opacity-60">
      <div className="h-1 bg-gradient-to-r from-transparent via-[#735c00] to-transparent mb-8 opacity-30 relative">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#735c00] bg-[#f5e6c8] px-2 text-xs">
          ◈
        </span>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 lg:px-10 text-center">
        <p className="font-crimson text-[#dc2626] italic mb-2 tracking-widest">
          Moony, Wormtail, Padfoot & Prongs
        </p>
        <p className="font-cinzel text-xs text-[#504440] uppercase tracking-[0.3em]">
          Est. 1971
        </p>
      </div>
    </footer>
  )
}
