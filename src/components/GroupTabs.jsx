import { GROUPS } from '../data/fabrics'

export default function GroupTabs({ active, onChange }) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide bg-[#111] border-b border-white/10 sticky top-0 z-30">
      <div className="flex min-w-max px-6 sm:px-10 gap-2 py-3">
        {GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-200 cursor-pointer ${
              active === g.id
                ? 'bg-[#EDE0C8] text-[#1a1a1a]'
                : 'text-[#c8b89a]/60 hover:text-[#c8b89a] border border-white/10 hover:border-white/30'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  )
}
