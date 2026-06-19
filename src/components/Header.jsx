export default function Header({ onColorsClick, onLogoClick }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onLogoClick}>
          <img src="/logo.png" alt="Butterfly" className="h-9 w-9 object-contain rounded-full shadow-sm" />
          <div className="leading-tight">
            <p className="text-base font-serif font-bold tracking-wide text-gray-900">Butterfly</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">Textile Showroom</p>
          </div>
        </div>

        {/* Center season tag — hidden on small */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#F7F5F2] rounded-full border border-gray-200">
          <span className="w-2 h-2 rounded-full" style={{ background: '#B5614A' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">Winter 2026</span>
        </div>

        {/* Colors button */}
        <button
          onClick={onColorsClick}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <div className="flex gap-1">
            {['#B5614A', '#2E3A52', '#EDE0C8', '#2A4A40', '#6B2737'].map(c => (
              <span key={c} className="w-3 h-3 rounded-full shadow-inner" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 hidden sm:block">
            Collection Colors
          </span>
        </button>

      </div>
    </header>
  )
}
