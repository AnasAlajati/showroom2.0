import { motion } from 'framer-motion'
import { PANTONE_COLORS, COLOR_FAMILIES } from '../data/colors'
import { FABRICS, GROUPS } from '../data/fabrics'
import { AdminIcon } from './AdminLogin'

const allColors = COLOR_FAMILIES.flatMap(f => f.codes.map(c => ({ code: c, ...PANTONE_COLORS[c] })))

export default function LandingPage({ onEnter, onFamilies, onPalette, isAdmin, onAdminClick }) {
  const totalPieces = FABRICS.reduce((sum, f) => {
    const g = f.garments ? Object.keys(f.garments).length : 0
    return sum + g
  }, 0)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f0d] flex flex-col">

      {/* Background fabric texture */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: 'url(/fabrics/02_WAFFLE_JACQUARD/BK-WAFFLE-GRID.jpeg)' }}
      />
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 flex items-center justify-between px-8 pt-7 pb-0"
      >
        <p className="text-[11px] tracking-[0.3em] uppercase font-light text-[#c8b89a]">
          Fabric Showroom
        </p>
        <div className="flex items-center gap-4 text-[11px] tracking-[0.25em] uppercase font-light text-[#c8b89a]">
          <span>{FABRICS.length} Fabrics</span>
          <span className="w-px h-3 bg-[#c8b89a]/40" />
          <span>{totalPieces} Pieces</span>
          {isAdmin ? (
            <button
              onClick={onAdminClick}
              className="ml-2 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity text-[10px] tracking-widest uppercase text-[#B5614A] border border-[#B5614A]/40 px-2.5 py-1 hover:border-[#B5614A]"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </button>
          ) : (
            <AdminIcon onClick={onAdminClick} />
          )}
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-14 pt-10">

        {/* Season tag */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex items-center gap-3 mb-6"
        >
          <span className="h-px w-8 bg-[#B5614A]" />
          <span className="text-[11px] tracking-[0.3em] uppercase font-bold text-[#B5614A]">2026 Winter</span>
          <span className="h-px w-8 bg-[#B5614A]" />
        </motion.div>

        {/* Headline */}
        <div className="overflow-hidden mb-2">
          <motion.h1
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(4rem,11vw,9rem)] leading-none font-serif font-medium text-[#EDE0C8] tracking-tight"
          >
            Collection
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-8">
          <motion.h2
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.75, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3.5rem,10vw,8rem)] leading-none font-serif italic font-light text-[#EDE0C8] tracking-tight pl-2"
          >
            Winter
          </motion.h2>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-[clamp(1rem,2.5vw,1.4rem)] font-serif italic text-[#c8b89a]/80 mb-12"
        >
          Where every thread begins.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="flex flex-wrap gap-3"
        >
          {/* Primary CTA */}
          <button
            onClick={onEnter}
            className="group flex items-center gap-4 px-7 py-4 bg-[#EDE0C8] hover:bg-[#f5ece0] transition-colors duration-200 cursor-pointer"
          >
            <span className="text-[10px] font-light tracking-[0.2em] text-[#2E3A52] uppercase">The</span>
            <span className="text-[13px] font-bold tracking-[0.25em] uppercase text-[#1a1a1a]">Look Book</span>
            <span className="text-[#B5614A] text-lg leading-none group-hover:translate-x-1 transition-transform duration-200">→</span>
          </button>

          {/* Palette */}
          <button
            onClick={onPalette}
            className="flex items-center gap-3 px-7 py-4 border border-[#EDE0C8]/40 hover:border-[#EDE0C8]/80 hover:bg-white/5 transition-all duration-200 cursor-pointer"
          >
            <div className="flex gap-1.5">
              {['#EDE0C8', '#B5614A', '#8E9EAA'].map(c => (
                <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <span className="text-[13px] font-bold tracking-[0.25em] uppercase text-[#EDE0C8]">Palette</span>
          </button>
        </motion.div>
      </div>

      {/* Bottom color strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="relative z-10 mt-auto"
      >
        {/* Color bar */}
        <div className="flex h-[5px]">
          {allColors.map(({ code, hex }) => (
            <div key={code} className="flex-1" style={{ background: hex }} />
          ))}
        </div>

        {/* Fabric group names */}
        <div className="flex overflow-x-auto scrollbar-hide border-t border-white/5 bg-black/40 backdrop-blur-sm">
          {GROUPS.filter(g => g.id !== 'all').map((g, i) => (
            <div
              key={g.id}
              onClick={() => onFamilies(g.id)}
              className="flex-shrink-0 px-5 py-3 cursor-pointer hover:bg-white/5 transition-colors border-r border-white/10 last:border-r-0"
            >
              <p className="text-[9px] text-[#c8b89a]/50 uppercase tracking-widest mb-0.5">
                {String(i + 1).padStart(2, '0')}
              </p>
              <p className="text-[10px] text-[#c8b89a] tracking-widest uppercase whitespace-nowrap font-light">
                {g.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
