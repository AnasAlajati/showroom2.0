import { useState } from 'react'
import { motion } from 'framer-motion'
import { PANTONE_COLORS } from '../data/colors'
import { GROUPS } from '../data/fabrics'

export default function FabricCard({ fabric, onClick, isAdmin, onDelete }) {
  const groupLabel = GROUPS.find(g => g.id === fabric.group)?.label ?? ''
  const colorName = fabric.pantones[0] ? PANTONE_COLORS[fabric.pantones[0]]?.name ?? '' : ''
  const [deleting, setDeleting] = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  async function handleDelete(e) {
    e.stopPropagation()
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)
    try {
      await fetch('/api/delete-fabric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fabricId: fabric.id }),
      })
      onDelete?.(fabric.id)
    } finally { setDeleting(false); setConfirm(false) }
  }

  return (
    <motion.div
      onClick={() => onClick(fabric)}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="group cursor-pointer relative overflow-hidden bg-[#1a1a1a]"
      onMouseLeave={() => setConfirm(false)}
    >
      {/* Full-bleed image */}
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        <img
          src={fabric.image}
          alt={fabric.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />

        {/* Permanent gradient for text at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Top: logo watermark + code */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain opacity-50" />
          <span className="text-[9px] tracking-[0.25em] uppercase text-white/30 font-light">
            {fabric.code}
          </span>
        </div>

        {/* Fleece badge */}
        {fabric.fleeseCombo && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <span className="text-[8px] tracking-[0.2em] uppercase text-[#EDE0C8]/70 border border-[#EDE0C8]/30 px-2 py-0.5">
              + Fleece
            </span>
          </div>
        )}

        {/* Admin: delete button */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-widest transition-all ${
              confirm
                ? 'bg-red-600 text-white border border-red-500'
                : 'bg-black/70 text-white/50 border border-white/20 hover:bg-red-600/80 hover:text-white hover:border-red-500'
            }`}
          >
            {deleting ? '…' : confirm ? 'Confirm?' : '✕'}
          </button>
        )}

        {/* Bottom: name + category */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <h3 className="text-[clamp(1.05rem,2.2vw,1.35rem)] font-serif font-semibold text-[#EDE0C8] leading-tight mb-1.5">
            {fabric.name}
          </h3>
          <p className="text-[9px] tracking-[0.22em] uppercase text-[#c8b89a]/60">
            {groupLabel}
            {colorName && <> &nbsp;•&nbsp; {colorName}</>}
          </p>
        </div>

        {/* Hover: view details overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-bold tracking-[0.25em] uppercase text-white border border-white/60 px-5 py-2.5">
            View Details
          </span>
        </div>
      </div>
    </motion.div>
  )
}
