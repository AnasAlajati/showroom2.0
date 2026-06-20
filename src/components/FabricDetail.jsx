import { useState, useRef } from 'react'
import LazyImage from './LazyImage'
import { motion, AnimatePresence } from 'framer-motion'
import { PANTONE_COLORS } from '../data/colors'
import { GROUPS, FABRICS } from '../data/fabrics'
import { FAMILIES } from '../data/families'
import { addGarmentImages, deleteGarmentImage, replaceTexture, deleteFabric, updateFabricField, updateFabric, reorderGarmentImages } from '../services/fabrics'

const TAB_LABEL = { men: 'Men', women: 'Women', kids: 'Children' }

function GarmentUploadZone({ fabric, gender, onUploaded }) {
  const [over,      setOver]      = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)
  const inputRef = useRef()

  async function handle(files) {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) return
    setUploading(true); setError(null)
    try {
      const urls = await addGarmentImages(fabric.id, gender, imgs)
      onUploaded(urls)
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
  const [deletedPaths, setDeletedPaths] = useState(new Set())
  const [deletingFab,  setDeletingFab]  = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [addingImgs,    setAddingImgs]    = useState(false)
  const [liveImage,     setLiveImage]     = useState(null)
  const [replacingImg,  setReplacingImg]  = useState(false)
  const [genderPicker,  setGenderPicker]  = useState(null) // null | 'men' | 'women' | 'kids'
  const [dragIdx,       setDragIdx]       = useState(null)
  const [overIdx,       setOverIdx]       = useState(null)
  const [tabOrders,     setTabOrders]     = useState({}) // { [tab]: string[] } overrides
  const [liveFamily,    setLiveFamily]    = useState(fabric.family ?? null)
  const [editingFamily, setEditingFamily] = useState(false)
  const [savingFamily,  setSavingFamily]  = useState(false)
  const [editingInfo,   setEditingInfo]   = useState(false)
  const [editingGroup,  setEditingGroup]  = useState(false)
  const [savingGroup,   setSavingGroup]   = useState(false)
  const [liveGroup,     setLiveGroup]     = useState(null)
  const [saveError,     setSaveError]     = useState('')
  const [infoForm,      setInfoForm]      = useState({
    name:       fabric.name       ?? '',
    group:      fabric.group      ?? '',
    structure:  fabric.structure  ?? '',
    gsm:        fabric.gsm        ?? '',
    pantones:   fabric.pantones   ?? [],
    fleeseCombo: fabric.fleeseCombo ?? false,
    fleeseNote: fabric.fleeseNote ?? '',
  })
  const [liveInfo,      setLiveInfo]      = useState(null) // set after save
  const [savingInfo,    setSavingInfo]    = useState(false)
  const addInputRef     = useRef()
  const replaceInputRef = useRef()

  const groupNum   = fabric.group.match(/^(\d+)/)?.[1] ?? ''
  const groupLabel = GROUPS.find(g => g.id === fabric.group)?.label ?? fabric.group
  const familyMeta = fabric.family ? FAMILIES[fabric.family] : null
  const familyPeers = fabric.family
    ? FABRICS.filter(f => f.family === fabric.family && f.id !== fabric.id)
    : []

  const baseImgs = [
    ...(fabric.garmentImages?.[activeTab] ?? []).filter(p => !deletedPaths.has(p)),
    ...(liveImgs[activeTab] ?? []).filter(p => !deletedPaths.has(p)),
  ]
  const garmentImgs = tabOrders[activeTab] ?? baseImgs
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

  async function deleteImage(url) {
    setDeletingImg(url)
    try {
      await deleteGarmentImage(fabric.id, activeTab, url)
      setDeletedPaths(prev => new Set([...prev, url]))
      setActiveImg(i => Math.min(i, Math.max(0, garmentImgs.length - 2)))
    } finally { setDeletingImg(null) }
  }

  async function handleDeleteFabric() {
    setDeletingFab(true)
    try {
      await deleteFabric(fabric.id)
      onDeleted?.()
      onClose(null)
    } finally { setDeletingFab(false); setConfirmDel(false) }
  }

  async function handleAddMore(files, gender) {
    const targetGender = gender ?? genderPicker ?? activeTab
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) return
    setAddingImgs(true)
    setGenderPicker(null)
    try {
      const urls = await addGarmentImages(fabric.id, targetGender, imgs)
      handleUploaded(targetGender, urls)
    } finally { setAddingImgs(false) }
  }

  function openAddPicker() {
    setGenderPicker(activeTab)
  }

  async function saveGroup(groupId) {
    setSavingGroup(true); setSaveError('')
    try {
      await updateFabricField(fabric.id, 'group', groupId)
      setLiveGroup(groupId)
      setInfoForm(f => ({ ...f, group: groupId }))
      setEditingGroup(false)
    } catch (e) {
      setSaveError(`Group save failed: ${e.message}`)
      console.error('saveGroup error', fabric.id, e)
    } finally { setSavingGroup(false) }
  }

  async function saveImageOrder(imgs) {
    const newOrder = imgs.filter(u => !deletedPaths.has(u))
    setTabOrders(prev => ({ ...prev, [activeTab]: newOrder }))
    try {
      await reorderGarmentImages(fabric.id, activeTab, newOrder)
    } catch (e) {
      setSaveError(`Order save failed: ${e.message}`)
      console.error('saveImageOrder error', fabric.id, activeTab, e)
    }
  }

  function handleDragEnd(imgs) {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      setDragIdx(null); setOverIdx(null); return
    }
    const next = [...imgs]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(overIdx, 0, moved)
    setDragIdx(null); setOverIdx(null)
    saveImageOrder(next)
  }

  async function saveInfo() {
    setSavingInfo(true); setSaveError('')
    try {
      await updateFabric(fabric.id, {
        name:        infoForm.name.trim(),
        group:       infoForm.group,
        structure:   infoForm.structure.trim(),
        gsm:         infoForm.gsm.trim(),
        pantones:    infoForm.pantones,
        fleeseCombo: infoForm.fleeseCombo,
        fleeseNote:  infoForm.fleeseNote.trim(),
      })
      setLiveInfo({ ...infoForm })
      setEditingInfo(false)
    } catch (e) {
      setSaveError(`Info save failed: ${e.message}`)
      console.error('saveInfo error', fabric.id, e)
    } finally { setSavingInfo(false) }
  }

  function togglePantone(code) {
    setInfoForm(f => ({
      ...f,
      pantones: f.pantones.includes(code)
        ? f.pantones.filter(c => c !== code)
        : [...f.pantones, code],
    }))
  }

  async function saveFamily(familyId) {
    setSavingFamily(true)
    try {
      await updateFabricField(fabric.id, 'family', familyId ?? null)
      setLiveFamily(familyId ?? null)
      setEditingFamily(false)
    } finally { setSavingFamily(false) }
  }

  async function handleReplaceImage(files) {
    const file = files[0]
    if (!file || !file.type.startsWith('image/')) return
    setReplacingImg(true)
    try {
      const url = await replaceTexture(fabric.id, file)
      setLiveImage(url)
    } finally { setReplacingImg(false) }
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
        <LazyImage
          src={liveImage ?? fabric.image}
          alt={fabric.name}
          className="absolute inset-0 w-full h-full"
          priority
        />

        {/* Top-to-bottom gradient — dark at bottom only */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

        {/* Admin: download + replace fabric image */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            {/* Replace */}
            <input ref={replaceInputRef} type="file" accept="image/*" className="sr-only"
                   onChange={e => handleReplaceImage(e.target.files)} />
            <button
              onClick={e => { e.stopPropagation(); replaceInputRef.current?.click() }}
              disabled={replacingImg}
              title="Replace fabric image"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/50 hover:bg-[#B5614A]/80 border border-white/20 hover:border-[#B5614A] text-white/60 hover:text-white transition-all text-[9px] uppercase tracking-widest disabled:opacity-40"
            >
              {replacingImg ? (
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              )}
              {replacingImg ? 'Saving…' : 'Replace'}
            </button>
            {/* Download */}
            <a
              href={liveImage ?? fabric.image}
              download={`${fabric.code}.jpeg`}
              onClick={e => e.stopPropagation()}
              title="Download fabric image"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/50 hover:bg-black/80 border border-white/20 hover:border-white/50 text-white/60 hover:text-white transition-all text-[9px] uppercase tracking-widest"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download
            </a>
          </div>
        )}

        {/* Bottom info */}
        <div className="relative mt-auto px-8 pb-10">
          {/* Group tag */}
          {editingGroup ? (
            <div className="mb-3 p-3 bg-white/5 border border-white/10">
              <p className="text-[8px] uppercase tracking-widest text-white/30 mb-2">Change Group</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {GROUPS.filter(g => g.id !== 'all').map(g => (
                  <button key={g.id} onClick={() => saveGroup(g.id)} disabled={savingGroup}
                          className={`w-full text-left px-2.5 py-1.5 text-[10px] tracking-wide transition-colors ${
                            (liveGroup ?? fabric.group) === g.id
                              ? 'bg-[#B5614A]/20 text-[#B5614A]'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}>
                    {g.label} {(liveGroup ?? fabric.group) === g.id && <span className="text-[8px]">✓</span>}
                  </button>
                ))}
              </div>
              <button onClick={() => setEditingGroup(false)} className="mt-2 text-[8px] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors">
                {savingGroup ? 'Saving…' : 'Cancel'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] tracking-[0.28em] uppercase font-semibold" style={{ color: '#B5614A' }}>
                {(liveGroup ?? liveInfo?.group ?? fabric.group).match(/^(\d+)/)?.[1] ?? groupNum} — {(GROUPS.find(g => g.id === (liveGroup ?? liveInfo?.group ?? fabric.group))?.label ?? groupLabel).toUpperCase()}
              </p>
              {isAdmin && (
                <button onClick={() => setEditingGroup(true)} className="text-white/20 hover:text-[#B5614A] transition-colors" title="Change group">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Fabric name */}
          <div className="flex items-start gap-2 mb-2">
            <h2 className="font-serif font-semibold text-[#EDE0C8] leading-tight flex-1"
                style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.5rem)' }}>
              {liveInfo?.name ?? fabric.name}
            </h2>
            {isAdmin && (
              <button
                onClick={() => setEditingInfo(true)}
                className="mt-2 flex-shrink-0 text-white/20 hover:text-[#B5614A] transition-colors"
                title="Edit fabric info"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </button>
            )}
          </div>

          <p className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-6">
            2026 Winter Collection
          </p>

          {/* Fabric technical details */}
          <div className="border-t border-white/15 pt-5 space-y-2.5">
            <DetailRow label="Structure" value={liveInfo?.structure ?? fabric.structure} />
            <DetailRow label="Weight"    value={`${liveInfo?.gsm ?? fabric.gsm} gsm`} />
            <DetailRow label="Type"      value="Circular Knit" />
            {/* Family row with optional edit */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <DetailRow
                  label="Family"
                  value={liveFamily ? (FAMILIES[liveFamily]?.label ?? liveFamily) : (isAdmin ? '—' : null)}
                />
              </div>
              {isAdmin && !editingFamily && (
                <button
                  onClick={() => setEditingFamily(true)}
                  className="mt-0.5 text-white/20 hover:text-[#B5614A] transition-colors flex-shrink-0"
                  title="Edit family"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                </button>
              )}
            </div>
            {isAdmin && editingFamily && (
              <div className="mt-2 p-3 bg-white/5 border border-white/10 space-y-1.5">
                <p className="text-[8px] uppercase tracking-widest text-white/30 mb-2">Select Family</p>
                {Object.values(FAMILIES).map(f => (
                  <button
                    key={f.id}
                    onClick={() => saveFamily(f.id)}
                    disabled={savingFamily}
                    className={`w-full text-left px-2.5 py-1.5 text-[10px] tracking-wide transition-colors ${
                      liveFamily === f.id
                        ? 'bg-[#B5614A]/20 text-[#B5614A]'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f.label}
                    {liveFamily === f.id && <span className="ml-1 text-[8px]">✓</span>}
                  </button>
                ))}
                <div className="border-t border-white/10 pt-1.5">
                  <button
                    onClick={() => saveFamily(null)}
                    disabled={savingFamily}
                    className="w-full text-left px-2.5 py-1.5 text-[10px] text-white/25 hover:text-white/50 transition-colors"
                  >
                    {liveFamily ? 'Remove from family' : 'No family'}
                  </button>
                </div>
                <button
                  onClick={() => setEditingFamily(false)}
                  className="text-[8px] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors pt-1"
                >
                  {savingFamily ? 'Saving…' : 'Cancel'}
                </button>
              </div>
            )}
          </div>

          {/* Pantone swatches */}
          <div className="mt-5">
            <p className="text-[9px] tracking-[0.25em] uppercase text-white/35 mb-2.5">Collection Colors</p>
            <div className="flex flex-wrap gap-2">
              {(liveInfo?.pantones ?? fabric.pantones).map(code => {
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

          {/* Save error banner */}
          {saveError && (
            <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <span className="text-red-400 text-[10px] flex-1 leading-relaxed">{saveError}</span>
              <button onClick={() => setSaveError('')} className="text-red-400/50 hover:text-red-400 text-xs flex-shrink-0">✕</button>
            </div>
          )}

          {/* Admin: delete fabric */}
          {isAdmin && (
            <div className="border-t border-white/10 pt-4 mt-4">
              {confirmDel ? (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest">Delete this fabric?</span>
                  <button onClick={handleDeleteFabric} disabled={deletingFab}
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
          {(liveInfo?.fleeseCombo ?? fabric.fleeseCombo) && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#B5614A] mb-1">+ Fleece Combination</p>
              <p className="text-[11px] text-white/50 leading-relaxed">{liveInfo?.fleeseNote ?? fabric.fleeseNote}</p>
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
                        <div
                          key={src}
                          className={`relative group flex-shrink-0 transition-opacity ${
                            dragIdx === i ? 'opacity-30' : 'opacity-100'
                          } ${overIdx === i && dragIdx !== i ? 'ring-2 ring-[#B5614A]' : ''}`}
                          draggable={isAdmin}
                          onDragStart={() => { setDragIdx(i); setActiveImg(i) }}
                          onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                          onDragLeave={() => setOverIdx(null)}
                          onDrop={() => handleDragEnd(garmentImgs)}
                          onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                        >
                          <button
                            onClick={() => setActiveImg(i)}
                            className={`w-full aspect-square overflow-hidden border-2 transition-colors cursor-pointer ${
                              activeImg === i ? 'border-[#B5614A]' : 'border-transparent hover:border-gray-300'
                            }`}
                          >
                            <LazyImage src={src} alt="" className="w-full h-full" priority={i === 0} />
                          </button>
                          {isAdmin && (
                            <>
                              {/* Drag handle */}
                              <div className="absolute top-0.5 left-0.5 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-70 cursor-grab active:cursor-grabbing transition-opacity">
                                <svg className="w-3 h-3 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                                  <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                                  <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                                </svg>
                              </div>
                              {/* Delete */}
                              <button
                                onClick={() => deleteImage(src)}
                                disabled={deletingImg === src}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/80 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 rounded-sm"
                              >
                                {deletingImg === src ? '…' : '×'}
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Piece count + admin add more */}
                <div className="px-6 sm:px-10 pb-4 pt-2 flex-shrink-0 flex items-center gap-4">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400">
                    {garmentImgs.length} {garmentImgs.length === 1 ? 'piece' : 'pieces'} in {TAB_LABEL[activeTab]}
                  </p>
                  {isAdmin && (
                    <>
                      <input ref={addInputRef} type="file" accept="image/*" multiple className="sr-only"
                             onChange={e => handleAddMore(e.target.files)} />
                      <button
                        onClick={openAddPicker}
                        disabled={addingImgs}
                        className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-gray-400 hover:text-[#B5614A] border border-gray-200 hover:border-[#B5614A] px-2 py-1 transition-colors disabled:opacity-40"
                      >
                        {addingImgs ? (
                          <span className="w-3 h-3 border border-gray-300 border-t-[#B5614A] rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        )}
                        Add Images
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : isAdmin ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <p className="text-[10px] tracking-widest uppercase text-gray-400">No images yet for this category</p>
                <button
                  onClick={openAddPicker}
                  className="flex items-center gap-2 px-5 py-3 border border-dashed border-gray-300 hover:border-[#B5614A] text-gray-400 hover:text-[#B5614A] text-[11px] uppercase tracking-widest transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Add Images
                </button>
              </div>
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

      {/* Edit info overlay */}
      {editingInfo && (
        <div className="absolute inset-0 z-[90] bg-[#0f0f0d]/98 overflow-y-auto flex flex-col">
          <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#B5614A]">Edit Fabric Info</p>
            <button onClick={() => setEditingInfo(false)} className="text-white/30 hover:text-white text-lg">✕</button>
          </div>

          <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto">
            {/* Name */}
            <Field label="Fabric Name">
              <input value={infoForm.name} onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))}
                     className="w-full bg-transparent border border-white/20 px-3 py-2 text-sm text-[#EDE0C8] focus:outline-none focus:border-[#B5614A] transition-colors" />
            </Field>

            {/* Group */}
            <Field label="Family / Group">
              <select value={infoForm.group} onChange={e => setInfoForm(f => ({ ...f, group: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/20 px-3 py-2 text-sm text-[#EDE0C8] focus:outline-none focus:border-[#B5614A] transition-colors">
                {GROUPS.filter(g => g.id !== 'all').map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </Field>

            {/* Structure */}
            <Field label="Structure">
              <input value={infoForm.structure} onChange={e => setInfoForm(f => ({ ...f, structure: e.target.value }))}
                     className="w-full bg-transparent border border-white/20 px-3 py-2 text-sm text-[#EDE0C8] focus:outline-none focus:border-[#B5614A] transition-colors" />
            </Field>

            {/* GSM */}
            <Field label="Weight (GSM)">
              <input value={infoForm.gsm} onChange={e => setInfoForm(f => ({ ...f, gsm: e.target.value }))}
                     className="w-full bg-transparent border border-white/20 px-3 py-2 text-sm text-[#EDE0C8] focus:outline-none focus:border-[#B5614A] transition-colors" />
            </Field>

            {/* Pantones */}
            <Field label="Collection Colors">
              <div className="flex flex-wrap gap-2">
                {Object.entries(PANTONE_COLORS).map(([code, c]) => (
                  <button key={code} onClick={() => togglePantone(code)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[9px] uppercase tracking-widest transition-all ${
                            infoForm.pantones.includes(code)
                              ? 'border-[#B5614A] bg-[#B5614A]/10 text-[#EDE0C8]'
                              : 'border-white/10 text-white/40 hover:border-white/30'
                          }`}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </Field>

            {/* Fleece */}
            <Field label="Fleece Combination">
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <div onClick={() => setInfoForm(f => ({ ...f, fleeseCombo: !f.fleeseCombo }))}
                     className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${infoForm.fleeseCombo ? 'bg-[#B5614A]' : 'bg-white/15'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${infoForm.fleeseCombo ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-[11px] text-white/50">{infoForm.fleeseCombo ? 'Yes' : 'No'}</span>
              </label>
              {infoForm.fleeseCombo && (
                <textarea value={infoForm.fleeseNote} rows={2}
                          onChange={e => setInfoForm(f => ({ ...f, fleeseNote: e.target.value }))}
                          placeholder="Describe the fleece combination…"
                          className="w-full bg-transparent border border-white/20 px-3 py-2 text-sm text-[#EDE0C8] placeholder:text-white/20 focus:outline-none focus:border-[#B5614A] resize-none transition-colors" />
              )}
            </Field>
          </div>

          <div className="border-t border-white/10 px-6 py-4 flex gap-3 flex-shrink-0">
            <button onClick={saveInfo} disabled={savingInfo}
                    className="px-6 py-2.5 bg-[#EDE0C8] text-[#1a1a1a] text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-40 flex items-center gap-2">
              {savingInfo && <span className="w-3 h-3 border-2 border-[#1a1a1a]/30 border-t-[#1a1a1a] rounded-full animate-spin" />}
              {savingInfo ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => setEditingInfo(false)}
                    className="px-4 py-2.5 border border-white/15 text-[11px] text-white/40 hover:text-white/70 hover:border-white/30 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Gender picker modal */}
      {genderPicker !== null && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center"
             onClick={() => setGenderPicker(null)}>
          <div className="bg-white rounded-sm shadow-2xl p-6 w-72" onClick={e => e.stopPropagation()}>
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 mb-1">Add Images To</p>
            <p className="text-sm font-serif text-gray-700 mb-5">{fabric.name}</p>
            <div className="flex flex-col gap-2 mb-5">
              {[['men', 'Men'], ['women', 'Women'], ['kids', 'Children']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setGenderPicker(key)}
                  className={`px-4 py-3 text-left text-[11px] uppercase tracking-widest border transition-colors ${
                    genderPicker === key
                      ? 'border-[#B5614A] bg-[#B5614A]/5 text-[#B5614A]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[11px] uppercase tracking-widest cursor-pointer hover:bg-black transition-colors">
                <input type="file" accept="image/*" multiple className="sr-only"
                       onChange={e => handleAddMore(e.target.files)} />
                Pick Files
              </label>
              <button onClick={() => setGenderPicker(null)}
                      className="px-4 py-2.5 border border-gray-200 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1.5">{label}</p>
      {children}
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
