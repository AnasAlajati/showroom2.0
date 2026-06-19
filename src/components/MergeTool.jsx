import { useState } from 'react'
import { FABRICS, GROUPS } from '../data/fabrics'

// Fabrics that have no garment images — candidates to merge into a Winter Essentials entry
const ORPHANS = FABRICS.filter(f => f.group !== '09_WINTER_ESSENTIALS' && !f.garmentImages)
const WINTER  = FABRICS.filter(f => f.group === '09_WINTER_ESSENTIALS')

export default function MergeTool({ onClose }) {
  const [selectedOrphan, setOrphan]   = useState(null)
  const [selectedWinter, setWinter]   = useState(null)
  const [chosenName,     setName]     = useState('')
  const [chosenGroup,    setGroup]    = useState('')
  const [chosenImage,    setImage]    = useState('winter') // 'orphan' | 'winter'
  const [pairs,          setPairs]    = useState([]) // finalised merges
  const [output,         setOutput]   = useState(null)

  function handlePair() {
    if (!selectedOrphan || !selectedWinter) return
    const name  = chosenName  || selectedWinter.name
    const group = chosenGroup || selectedOrphan.group
    setPairs(p => [...p.filter(x => x.orphanId !== selectedOrphan.id && x.winterId !== selectedWinter.id), {
      orphanId:  selectedOrphan.id,
      winterId:  selectedWinter.id,
      finalName: name,
      finalGroup: group,
      useImage:  chosenImage,
    }])
    setOrphan(null); setWinter(null); setName(''); setGroup(''); setImage('winter')
  }

  function removePair(orphanId) {
    setPairs(p => p.filter(x => x.orphanId !== orphanId))
  }

  function generate() {
    const result = pairs.map(p => {
      const orphan = FABRICS.find(f => f.id === p.orphanId)
      const winter = FABRICS.find(f => f.id === p.winterId)
      return {
        REMOVE_ID:   winter.id,
        REPLACE_ID:  orphan.id,
        finalName:   p.finalName,
        finalGroup:  p.finalGroup,
        finalImage:  p.useImage === 'orphan' ? orphan.image : winter.image,
        garmentImages: winter.garmentImages,
        pantones:    orphan.pantones,
        customers:   winter.customers,
        garments:    winter.garments,
        structure:   orphan.structure,
        gsm:         orphan.gsm,
        fleeseCombo: orphan.fleeseCombo,
        fleeseNote:  orphan.fleeseNote,
      }
    })
    setOutput(JSON.stringify(result, null, 2))
  }

  const pairedOrphanIds  = new Set(pairs.map(p => p.orphanId))
  const pairedWinterIds  = new Set(pairs.map(p => p.winterId))

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f0f0d] overflow-y-auto text-[#EDE0C8]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0d] border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl text-[#EDE0C8]">Fabric Merge Tool</h1>
          <p className="text-[10px] tracking-widest uppercase text-[#c8b89a]/50 mt-0.5">Dev only · not visible in production</p>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white text-xl px-3">✕</button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Step 1: Select pair */}
        <section>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#B5614A] mb-4">Step 1 — Select a pair to merge</p>
          <div className="grid grid-cols-2 gap-6">

            {/* Left: orphans */}
            <div>
              <p className="text-[10px] tracking-widest uppercase text-white/40 mb-3">Existing fabrics without garment images</p>
              <div className="space-y-2">
                {ORPHANS.map(f => {
                  const isPaired = pairedOrphanIds.has(f.id)
                  const isActive = selectedOrphan?.id === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => !isPaired && setOrphan(isActive ? null : f)}
                      disabled={isPaired}
                      className={`w-full flex items-center gap-3 p-3 border text-left transition-all ${
                        isPaired  ? 'opacity-30 cursor-not-allowed border-white/5' :
                        isActive  ? 'border-[#B5614A] bg-[#B5614A]/10' :
                                    'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={f.image} alt="" className="w-14 h-14 object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#EDE0C8] truncate">{f.name}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-widest">
                          {GROUPS.find(g => g.id === f.group)?.label}
                        </p>
                        <p className="text-[9px] text-white/30 mt-0.5 italic">{f.structure}</p>
                      </div>
                      {isPaired && <span className="ml-auto text-[9px] text-[#B5614A] tracking-widest uppercase flex-shrink-0">Paired</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: winter essentials */}
            <div>
              <p className="text-[10px] tracking-widest uppercase text-white/40 mb-3">Winter Essentials (new images)</p>
              <div className="space-y-2">
                {WINTER.map(f => {
                  const isPaired = pairedWinterIds.has(f.id)
                  const isActive = selectedWinter?.id === f.id
                  const imgCount = Object.values(f.garmentImages ?? {}).flat().length
                  return (
                    <button
                      key={f.id}
                      onClick={() => !isPaired && setWinter(isActive ? null : f)}
                      disabled={isPaired}
                      className={`w-full flex items-center gap-3 p-3 border text-left transition-all ${
                        isPaired  ? 'opacity-30 cursor-not-allowed border-white/5' :
                        isActive  ? 'border-[#B5614A] bg-[#B5614A]/10' :
                                    'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={f.image} alt="" className="w-14 h-14 object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#EDE0C8] truncate">{f.name}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-widest">{f.code}</p>
                        <p className="text-[9px] text-white/30 mt-0.5">{imgCount} garment images</p>
                      </div>
                      {isPaired && <span className="ml-auto text-[9px] text-[#B5614A] tracking-widest uppercase flex-shrink-0">Paired</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: configure merge (only when both selected) */}
        {selectedOrphan && selectedWinter && (
          <section className="border border-[#B5614A]/40 bg-[#B5614A]/5 p-6 space-y-5">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#B5614A] mb-2">Step 2 — Configure the merged fabric</p>

            {/* Side by side preview */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Existing (no garments)', fabric: selectedOrphan, key: 'orphan' },
                { label: 'Winter Essentials (has garments)', fabric: selectedWinter, key: 'winter' },
              ].map(({ label, fabric, key }) => (
                <div key={key}
                     onClick={() => setImage(key)}
                     className={`cursor-pointer border-2 p-3 transition-all ${chosenImage === key ? 'border-[#EDE0C8]' : 'border-white/10 hover:border-white/30'}`}>
                  <p className="text-[9px] uppercase tracking-widest text-white/40 mb-2">{label}</p>
                  <img src={fabric.image} alt="" className="w-full aspect-square object-cover mb-2" />
                  <p className="text-[10px] text-[#EDE0C8]">{fabric.name}</p>
                  {chosenImage === key && (
                    <p className="text-[9px] text-[#B5614A] tracking-widest uppercase mt-1">✓ Use this texture image</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[9px] text-white/40">Click a card above to choose which fabric texture photo to keep as the main image.</p>

            {/* Name */}
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1.5">Final name</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {[selectedOrphan.name, selectedWinter.name].map(n => (
                  <button key={n} onClick={() => setName(n)}
                          className={`text-[10px] px-3 py-1.5 border transition-colors ${chosenName === n ? 'border-[#EDE0C8] text-[#EDE0C8]' : 'border-white/20 text-white/50 hover:border-white/40'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <input
                value={chosenName || ''}
                onChange={e => setName(e.target.value)}
                placeholder="Or type a custom name…"
                className="w-full bg-transparent border border-white/20 px-3 py-2 text-sm text-[#EDE0C8] placeholder:text-white/20 focus:outline-none focus:border-[#B5614A]"
              />
            </div>

            {/* Group */}
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1.5">Final fabric family / group</label>
              <div className="flex gap-2 flex-wrap">
                {GROUPS.filter(g => g.id !== 'all').map(g => (
                  <button key={g.id} onClick={() => setGroup(g.id)}
                          className={`text-[10px] px-3 py-1.5 border transition-colors ${chosenGroup === g.id ? 'border-[#EDE0C8] text-[#EDE0C8]' : 'border-white/20 text-white/50 hover:border-white/40'}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePair}
              disabled={!chosenName && !selectedWinter}
              className="px-6 py-3 bg-[#EDE0C8] text-[#1a1a1a] text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-30"
            >
              Confirm Pair →
            </button>
          </section>
        )}

        {/* Confirmed pairs */}
        {pairs.length > 0 && (
          <section>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#B5614A] mb-4">Confirmed pairs ({pairs.length})</p>
            <div className="space-y-2">
              {pairs.map(p => {
                const orphan = FABRICS.find(f => f.id === p.orphanId)
                const winter = FABRICS.find(f => f.id === p.winterId)
                return (
                  <div key={p.orphanId} className="flex items-center gap-4 border border-white/10 p-3">
                    <img src={p.useImage === 'orphan' ? orphan.image : winter.image} alt=""
                         className="w-12 h-12 object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-serif text-[#EDE0C8]">{p.finalName}</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest">
                        {GROUPS.find(g => g.id === p.finalGroup)?.label || p.finalGroup}
                      </p>
                      <p className="text-[9px] text-white/30 mt-0.5">
                        {orphan.name} + {winter.name}
                      </p>
                    </div>
                    <button onClick={() => removePair(p.orphanId)}
                            className="text-white/30 hover:text-white/70 px-2 text-xs">Remove</button>
                  </div>
                )
              })}
            </div>

            <button
              onClick={generate}
              className="mt-4 px-6 py-3 bg-[#B5614A] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#c4715a] transition-colors"
            >
              Generate Merge Config →
            </button>
          </section>
        )}

        {/* Output */}
        {output && (
          <section>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#B5614A] mb-3">
              Done — send this to Claude and say "apply merge config"
            </p>
            <pre className="bg-black/60 border border-white/10 p-4 text-[10px] text-[#c8b89a] overflow-x-auto whitespace-pre-wrap rounded">
              {output}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="mt-3 px-4 py-2 border border-white/20 text-[10px] uppercase tracking-widest text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              Copy to clipboard
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
