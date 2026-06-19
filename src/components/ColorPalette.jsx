import { PANTONE_COLORS, COLOR_FAMILIES } from '../data/colors'

export default function ColorPalette({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-sm font-serif font-semibold">Collection Colors</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Winter 2026 — Official Pantone Palette</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Key color callout */}
        <div className="rounded-2xl overflow-hidden border-2 border-brand-indigo p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: '#2E3A52' }} />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-brand-indigo mb-0.5">Key Color of the Season</p>
            <p className="text-base font-serif font-semibold text-brand-dark">Dark Indigo</p>
            <p className="text-xs text-gray-500">Pantone 19-4118 · #2E3A52</p>
          </div>
        </div>

        {/* Color families */}
        {COLOR_FAMILIES.map(family => (
          <div key={family.id}>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">{family.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {family.codes.map(code => {
                const color = PANTONE_COLORS[code]
                if (!color) return null
                return (
                  <div key={code} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 shadow-sm"
                      style={{ background: color.hex }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-brand-dark">{color.name}</p>
                      <p className="text-[10px] text-gray-400">{code}</p>
                      <p className="text-[10px] font-mono text-gray-400">{color.hex}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Pairing guide */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Recommended Pairings</p>
          <div className="space-y-2">
            {[
              { a: '19-4118', b: '16-4010', label: 'Deep-to-mid blue tonal' },
              { a: '18-1435', b: '15-1905', label: 'Terracotta + Mauve — women\'s hero' },
              { a: '19-5350', b: '19-0403', label: 'Bottle Green + Olive — men\'s deep' },
              { a: '13-0908', b: '19-4118', label: 'Cream + Indigo — clean contrast' },
              { a: '13-2803', b: '19-1620', label: 'Blush + Burgundy — soft feminine' },
            ].map(({ a, b, label }) => {
              const ca = PANTONE_COLORS[a]
              const cb = PANTONE_COLORS[b]
              if (!ca || !cb) return null
              return (
                <div key={`${a}-${b}`} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                  <div className="flex gap-1.5 flex-shrink-0">
                    <div className="w-7 h-7 rounded-lg" style={{ background: ca.hex }} />
                    <div className="w-7 h-7 rounded-lg" style={{ background: cb.hex }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-dark">{ca.name} + {cb.name}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
