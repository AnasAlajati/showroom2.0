import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PANTONE_COLORS } from '../data/colors'
import { GROUPS, FABRICS } from '../data/fabrics'
import { FAMILIES } from '../data/families'

const TAB_LABEL = { men: 'Men', women: 'Women', kids: 'Children' }

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve({ data: r.result.split(',')[1], ext: file.name.split('.').pop() })
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function GarmentUploadZone({ fabric, gender, onUploaded }) {
  const [over,     setOver]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,    setError]    = useState(null)
  const inputRef = useRef()

  async function handle(files) {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) return
    setUploading(true); setError(null)
    try {
      const encoded = await Promise.all(imgs.map(readAsBase64))
      const res = await fetch('/api/add-garment-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fabricId: fabric.id,
          group:    fabric.group,
          code:     fabric.code,
          gender,
          images:   encoded,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      onUploaded(json.paths)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-10 py-16">
      {/* Garment suggestion text */}
      {fabric.garments?.[gender] && (
        <div className="mb-8 text-center">
          <p className="text-[9px] tracking-[0.25em] uppercase text-gray-300 mb-2">Garment Suggestion</p>
          <p className="text-sm font-serif text-gray-600 leading-relaxed max-w-xs">
            {fabric.garments[gender]}
          </p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`w-full max-w-sm border-2 border-dashed rounded-sm cursor-pointer transition-all flex flex-col items-center gap-3 py-10 px-6 ${
          over ? 'border-[#B5614A] bg-[#B5614A]/5' : 'border-gray-200 hover:border-gray-400'
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only"
               onChange={e => handle(e.target.files)} />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#B5614A] rounded-full animate-spin" />
            <p className="text-[10px] tracking-widest uppercase text-gray-400">Saving…</p>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Add Images</p>
              <p className="text-[10px] text-gray-300 mt-1">Drop photos here or click to browse</p>
              <p className="text-[10px] text-gray-300">Select multiple at once</p>
            </div>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-[10px] text-red-400 text-center">{error}</p>}
    </div>
  )
}

export default function FabricDetail({ fabric, onClose, isAdmin, onDeleted }) {
  const availableTabs = ['men', 'women', 'kids'].filter(t => fabric.garments?.[t])
  const [activeTab, setActiveTab]   = useState(availableTabs[0] ?? 'men')
  const [activeImg, setActiveImg]   = useState(0)
  const [zoomed, setZoomed]         = useState(false)
  const [liveImgs, setLiveImgs]     = useState({})
  const [deletingImg,  setDeletingImg]  = useState(null)
  const [deletingFab,  setDeletingFab]  = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)

  const groupNum   = fabric.group.match(/^(\d+)/)?.[1] ?? ''
  const groupLabel = GROUPS.find(g => g.id === fabric.group)?.label ?? fabric.group
  const familyMeta = fabric.family ? FAMILIES[fabric.family] : null
  const familyPeers = fabric.family
    ? FABRICS.filter(f => f.family === fabric.family && f.id !== fabric.id)
    : []

  const garmentImgs = [...(fabric.garmentImages?.[activeTab] ?? []), ...(liveImgs[activeTab] ?? [])]
  const mainSrc     = garmentImgs[activeImg] ?? null

  // All tabs including ones that only have live-uploaded images
  const allTabs = ['men', 'women', 'kids'].filter(t =>
    fabric.garments?.[t] || garmentImgs.length > 0 || fabric.garmentImages?.[t]
  )
  const visibleTabs = ['men', 'women', 'kids'].filter(t =>
    fabric.garments?.[t] || (fabric.garmentImages?.[t]?.length) || (liveImgs[t]?.length)
  )

  function handleUploaded(tab, paths) {
    setLiveImgs(prev => ({ ...prev, [tab]: [...(prev[tab] ?? []), ...paths] }))
    setActiveTab(tab)
    setActiveImg(0)
  }

  async function deleteImage(path) {
    setDeletingImg(path)
    try {
      await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: path }),
      })
      // Remove from live state
      setLiveImgs(prev => {
        const next = { ...prev }
        for (const g of Object.keys(next)) next[g] = (next[g] ?? []).filter(p => p !== path)
        return next
      })
      if (activeImg >= garmentImgs.length - 1) setActiveImg(Math.max(0, garmentImgs.length - 2))
    } finally { setDeletingImg(null) }
  }

  async function deleteFabric() {
    setDeletingFab(true)
    try {
      await fetch('/api/delete-fabric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fabricId: fabric.id }),
      })
      onDeleted?.()
      onClose(null)
    } finally { setDeletingFab(false); setConfirmDel(false) }
  }

  // reset selected image when tab changes
  function switchTab(tab) {
    setActiveTab(tab)
    setActiveImg(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-white overflow-hidden">

      {/* ── LEFT PANEL: Fabric close-up ─────────────────────── */}
      <div className="hidden md:flex md:w-[40%] lg:w-[38%] relative flex-col flex-shrink-0 overflow-hidden">
        {/* Fabric image */}
        <img
          src={fabric.image}
          alt={fabric.name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Top-to-bottom gradient — dark at bottom only */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

        {/* Bottom info */}
        <div className="relative mt-auto px-8 pb-10">
          {/* Group tag */}
          <p className="text-[10px] tracking-[0.28em] uppercase font-semibold mb-3" style={{ color: '#B5614A' }}>
            {groupNum} — {groupLabel.toUpperCase()}
          </p>

          {/* Fabric name */}
          <h2 className="font-serif font-semibold text-[#EDE0C8] leading-tight mb-2"
              style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.5rem)' }}>
            {fabric.name}
          </h2>

          <p className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-6">
            2026 Winter Collection
          </p>

          {/* Fabric technical details */}
          <div className="border-t border-white/15 pt-5 space-y-2.5">
            <DetailRow label="Structure" value={fabric.structure} />
            <DetailRow label="Weight"    value={`${fabric.gsm} gsm`} />
            <DetailRow label="Type"      value="Circular Knit" />
            {familyMeta && (
              <DetailRow label="Family" value={familyMeta.label} />
            )}
          </div>

          {/* Pantone swatches */}
          <div className="mt-5">
            <p className="text-[9px] tracking-[0.25em] uppercase text-white/35 mb-2.5">Collection Colors</p>
            <div className="flex flex-wrap gap-2">
              {fabric.pantones.map(code => {
                const c = PANTONE_COLORS[code]
                if (!c) return null
                return (
                  <div key={code} className="flex items-center gap-1.5" title={`${c.name} · ${code}`}>
                    <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                          style={{ background: c.hex }} />
                    <span className="text-[9px] text-white/50 uppercase tracking-widest">{c.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Admin: delete fabric */}
          {isAdmin && (
            <div className="border-t border-white/10 pt-4 mt-4">
              {confirmDel ? (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest">Delete this fabric?</span>
                  <button onClick={deleteFabric} disabled={deletingFab}
                          className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400 px-2 py-1 transition-colors">
                    {deletingFab ? '…' : 'Yes, delete'}
                  </button>
                  <button onClick={() => setConfirmDel(false)}
                          className="text-[9px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDel(true)}
                        className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/20 hover:text-red-400 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete Fabric
                </button>
              )}
            </div>
          )}

          {/* Fleece note */}
          {fabric.fleeseCombo && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#B5614A] mb-1">+ Fleece Combination</p>
              <p className="text-[11px] text-white/50 leading-relaxed">{fabric.fleeseNote}</p>
            </div>
          )}

          {/* Same-family peers */}
          {familyPeers.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-[9px] tracking-[0.25em] uppercase text-white/35 mb-2.5">Same Family</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {familyPeers.map(peer => (
                  <button key={peer.id} onClick={() => onClose(peer)}
                          className="flex-shrink-0 w-14 h-14 rounded overflow-hidden border border-white/20 hover:border-[#B5614A] transition-colors">
                    <img src={peer.image} alt={peer.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Garment browser ────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">

        {/* Top bar: tabs + close */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 sm:px-10 flex-shrink-0">
          <div className="flex items-center gap-1">
            {['men', 'women', 'kids'].filter(t => fabric.garments?.[t]).map(tab => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`relative px-5 py-4 text-[12px] tracking-[0.2em] uppercase font-semibold transition-colors cursor-pointer ${
                  activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {TAB_LABEL[tab]}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: '#B5614A' }} />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => onClose(null)}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-y-auto"
          >
            {garmentImgs.length > 0 ? (
              <>
                {/* Image + thumbnail strip */}
                <div className="flex flex-1 gap-3 px-6 sm:px-10 pt-6 pb-2 min-h-0">

                  {/* Main image */}
                  <div
                    className="flex-1 relative bg-gray-50 overflow-hidden cursor-zoom-in"
                    onClick={() => setZoomed(true)}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImg}
                        src={mainSrc}
                        alt={fabric.name}
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="w-full h-full object-contain"
                        style={{ maxHeight: '72vh' }}
                      />
                    </AnimatePresence>
                    <p className="absolute bottom-3 right-4 text-[9px] tracking-[0.25em] uppercase text-gray-300">
                      Click to Enlarge
                    </p>
                  </div>

                  {/* Thumbnail strip */}
                  {garmentImgs.length > 0 && (
                    <div className="flex flex-col gap-2 w-[88px] sm:w-[100px] flex-shrink-0 overflow-y-auto scrollbar-hide">
                      {garmentImgs.map((src, i) => (
                        <div key={i} className="relative group flex-shrink-0">
                          <button
                            onClick={() => setActiveImg(i)}
                            className={`w-full aspect-square overflow-hidden border-2 transition-colors cursor-pointer ${
                              activeImg === i ? 'border-[#B5614A]' : 'border-transparent hover:border-gray-300'
                            }`}
                          >
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => deleteImage(src)}
                              disabled={deletingImg === src}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/80 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 rounded-sm"
                            >
                              {deletingImg === src ? '…' : '×'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Piece count */}
                <div className="px-6 sm:px-10 pb-4 pt-2 flex-shrink-0">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400">
                    {garmentImgs.length} {garmentImgs.length === 1 ? 'piece' : 'pieces'} in {TAB_LABEL[activeTab]}
                  </p>
                </div>
              </>
            ) : (
              <GarmentUploadZone
                fabric={fabric}
                gender={activeTab}
                onUploaded={paths => handleUploaded(activeTab, paths)}
              />
            )}

            {/* Mobile: show fabric info */}
            <div className="md:hidden border-t border-gray-100 px-6 py-6 space-y-3">
              <p className="text-[9px] tracking-[0.25em] uppercase text-gray-400 mb-4">Fabric Details</p>
              <DetailRowLight label="Structure" value={fabric.structure} />
              <DetailRowLight label="Weight"    value={`${fabric.gsm} gsm`} />
              <DetailRowLight label="Group"     value={groupLabel} />
              <div className="flex flex-wrap gap-2 pt-2">
                {fabric.pantones.map(code => {
                  const c = PANTONE_COLORS[code]
                  if (!c) return null
                  return (
                    <div key={code} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0" style={{ background: c.hex }} />
                      <span className="text-[10px] text-gray-600">{c.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fullscreen zoom */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setZoomed(false)}
        >
          <img src={mainSrc} alt="" className="max-w-[95vw] max-h-[95vh] object-contain" />
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[9px] tracking-[0.22em] uppercase text-white/35 w-16 flex-shrink-0">{label}</span>
      <span className="text-[11px] text-white/70">{value}</span>
    </div>
  )
}

function DetailRowLight({ label, value }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[9px] tracking-[0.22em] uppercase text-gray-400 w-16 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-700">{value}</span>
    </div>
  )
}
