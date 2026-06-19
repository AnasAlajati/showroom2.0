import { FABRICS } from '../data/fabrics'

export default function LookbookHeader({ onHome, displayed, activeGroup }) {
  const totalLooks = FABRICS.reduce((sum, f) =>
    sum + (f.garments ? Object.keys(f.garments).length : 0), 0)

  const groupLabel = activeGroup === 'all'
    ? 'All Fabrics with Garments'
    : activeGroup.replace(/^\d+_/, '').replace(/_/g, ' ')

  return (
    <div className="bg-[#111] border-b border-white/10 px-6 sm:px-10 pt-7 pb-5">
      <div className="flex items-start justify-between gap-4">

        {/* Left: back + title */}
        <div>
          <button
            onClick={onHome}
            className="flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-[#c8b89a]/60 hover:text-[#c8b89a] transition-colors mb-4 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Home
          </button>

          <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] font-serif font-bold text-[#EDE0C8] leading-none tracking-tight">
            Look Book
          </h1>
          <p className="text-[10px] tracking-[0.28em] uppercase text-[#c8b89a]/50 mt-2">
            {groupLabel} &nbsp;·&nbsp; 2026 Winter
          </p>
        </div>

        {/* Right: counts */}
        <div className="text-right flex-shrink-0 pt-10">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#c8b89a]/60">
            {displayed} Fabrics &nbsp;·&nbsp; {totalLooks} Looks
          </p>
        </div>
      </div>
    </div>
  )
}
