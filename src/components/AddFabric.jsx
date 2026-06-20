import { useState, useCallback } from 'react'
import { GROUPS } from '../data/fabrics'
import { PANTONE_COLORS } from '../data/colors'
import { createFabric } from '../services/fabrics'
import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const GENDERS = ['men', 'women', 'kids']
const GENDER_LABEL = { men: 'Men', women: 'Women', kids: 'Children' }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

async function uploadFile(file, path) {
  const r    = ref(storage, path)
  const snap = await uploadBytes(r, file)
  return getDownloadURL(snap.ref)
}

function DropZone({ label, multiple = false, files, onFiles, accent = false }) {
  const [over, setOver] = useState(false)

  const handle = useCallback(raw => {
    const list     = Array.from(raw).filter(f => f.type.startsWith('image/'))
    if (!list.length) return
    const previews = list.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }))
    onFiles(multiple ? prev => [...prev, ...previews] : [previews[0]])
  }, [multiple, onFiles])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files) }}
      className={`relative border-2 border-dashed rounded transition-all ${
        over
          ? 'border-[#B5614A] bg-[#B5614A]/10'
          : files.length
          ? 'border-white/30 bg-white/5'
          : 'border-white/15 hover:border-white/30'
      }`}
    >
      {files.length === 0 ? (
        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-6 px-4">
          <input type="file" accept="image/*" multiple={multiple} className="sr-only"
            onChange={e => handle(e.target.files)} />
          <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-[10px] tracking-widest uppercase text-white/30 text-center">{label}</p>
        </label>
      ) : (
        <div className="p-2">
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative group">
                <img src={f.preview} alt="" className="w-16 h-16 object-cover rounded" />
                <button
                  onClick={() => onFiles(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-black/80 text-white text-[9px] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >×</button>
              </div>
            ))}
            {multiple && (
              <label className="w-16 h-16 border border-dashed border-white/20 rounded flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors">
                <input type="file" accept="image/*" multiple className="sr-only"
                  onChange={e => handle(e.target.files)} />
                <span className="text-white/30 text-xl">+</span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AddFabric({ onClose }) {
  const [name,       setName]       = useState('')
  const [group,      setGroup]      = useState('09_WINTER_ESSENTIALS')
  const [structure,  setStructure]  = useState('')
  const [gsm,        setGsm]        = useState('310–350')
  const [fleece,     setFleece]     = useState(false)
  const [fleeceNote, setFleeceNote] = useState('')
  const [pantones,   setPantones]   = useState([])
  const [texture,    setTexture]    = useState([])
  const [garments,   setGarments]   = useState({ men: [], women: [], kids: [] })
  const [status,     setStatus]     = useState(null) // null | 'loading' | 'ok' | 'error'
  const [errorMsg,   setError]      = useState('')

  function togglePantone(code) {
    setPantones(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code])
  }

  async function submit() {
    if (!name.trim())    return setError('Fabric name is required')
    if (!texture.length) return setError('Texture image is required')
    setError('')
    setStatus('loading')

    try {
      const slug = name.trim().replace(/[—–]/g, '-').replace(/[^a-zA-Z0-9\s-]/g, '')
        .trim().replace(/\s+/g, '-').toUpperCase()
      const id = slug.toLowerCase()

      // Upload texture
      const texFile = texture[0].file
      const texExt  = texFile.name.split('.').pop().toLowerCase()
      const texUrl  = await uploadFile(texFile, `fabrics/${id}/texture.${texExt}`)

      // Upload garment images
      const garmentImages = {}
      const customers     = []
      for (const g of GENDERS) {
        if (!garments[g].length) continue
        customers.push(g)
        garmentImages[g] = []
        for (const item of garments[g]) {
          const ext = item.file.name.split('.').pop().toLowerCase()
          const url = await uploadFile(item.file, `garments/${id}/${g}/${uid()}.${ext}`)
          garmentImages[g].push(url)
        }
      }

      await createFabric({
        id, code: slug, name: name.trim(), group,
        image: texUrl, structure, gsm,
        customers,
        garments: Object.fromEntries(customers.map(g => [g, ''])),
        pantones, fleeseCombo: fleece,
        ...(fleece && fleeceNote ? { fleeseNote } : {}),
        ...(Object.keys(garmentImages).length ? { garmentImages } : {}),
      })

      setStatus('ok')
    } catch (e) {
      setStatus('error')
      setError(e.message)
    }
  }

  const hasGarments = GENDERS.some(g => garments[g].length > 0)

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f0f0d] overflow-y-auto text-[#EDE0C8]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0d]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl text-[#EDE0C8]">Add Fabric</h1>
          <p className="text-[10px] tracking-widest uppercase text-[#c8b89a]/40 mt-0.5">Drop images · fill details · done</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-xl px-3">✕</button>
      </div>

      {status === 'ok' ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
          <div className="w-12 h-12 rounded-full bg-[#B5614A]/20 flex items-center justify-center">
            <span className="text-[#B5614A] text-2xl">✓</span>
          </div>
          <p className="font-serif text-xl text-[#EDE0C8]">Added to collection</p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">The page will hot-reload automatically</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { setStatus(null); setName(''); setTexture([]); setGarments({ men:[], women:[], kids:[] }) }}
                    className="px-5 py-2.5 border border-white/20 text-[11px] uppercase tracking-widest text-white/60 hover:text-white hover:border-white/40 transition-colors">
              Add Another
            </button>
            <button onClick={onClose}
                    className="px-5 py-2.5 bg-[#EDE0C8] text-[#1a1a1a] text-[11px] uppercase tracking-widest font-bold hover:bg-white transition-colors">
              Back to Lookbook
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

          {/* Texture image */}
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-2">
              Fabric Texture Image <span className="text-[#B5614A]">*</span>
            </label>
            <DropZone label="Drop fabric close-up here" files={texture} onFiles={setTexture} />
          </div>

          {/* Name + Group */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-2">
                Fabric Name <span className="text-[#B5614A]">*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Fine Rib — Steel Blue"
                className="w-full bg-transparent border border-white/20 px-3 py-2.5 text-sm text-[#EDE0C8] placeholder:text-white/20 focus:outline-none focus:border-[#B5614A] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-2">Family / Group</label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/20 px-3 py-2.5 text-sm text-[#EDE0C8] focus:outline-none focus:border-[#B5614A] transition-colors"
              >
                {GROUPS.filter(g => g.id !== 'all').map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Structure + GSM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-2">Structure</label>
              <input
                value={structure}
                onChange={e => setStructure(e.target.value)}
                placeholder="e.g. Fine vertical 2×2 rib knit"
                className="w-full bg-transparent border border-white/20 px-3 py-2.5 text-sm text-[#EDE0C8] placeholder:text-white/20 focus:outline-none focus:border-[#B5614A] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-2">GSM</label>
              <input
                value={gsm}
                onChange={e => setGsm(e.target.value)}
                className="w-full bg-transparent border border-white/20 px-3 py-2.5 text-sm text-[#EDE0C8] focus:outline-none focus:border-[#B5614A] transition-colors"
              />
            </div>
          </div>

          {/* Garment images */}
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-3">
              Garment Images <span className="text-white/25">(drop multiple per category)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {GENDERS.map(g => (
                <div key={g}>
                  <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1.5">{GENDER_LABEL[g]}</p>
                  <DropZone
                    label={`Drop ${GENDER_LABEL[g]} images`}
                    multiple
                    files={garments[g]}
                    onFiles={files => setGarments(prev => ({
                      ...prev,
                      [g]: typeof files === 'function' ? files(prev[g]) : files,
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pantone swatches */}
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-3">
              Collection Colors <span className="text-white/25">(tap to toggle)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PANTONE_COLORS).map(([code, c]) => (
                <button
                  key={code}
                  onClick={() => togglePantone(code)}
                  className={`flex items-center gap-2 px-3 py-1.5 border transition-all ${
                    pantones.includes(code)
                      ? 'border-[#EDE0C8] bg-white/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: c.hex }} />
                  <span className="text-[9px] uppercase tracking-widest text-white/60">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fleece */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setFleece(f => !f)}
                   className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${fleece ? 'bg-[#B5614A]' : 'bg-white/15'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${fleece ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-[11px] uppercase tracking-widest text-white/50">Fleece Combination</span>
            </label>
            {fleece && (
              <input
                value={fleeceNote}
                onChange={e => setFleeceNote(e.target.value)}
                placeholder="Describe the fleece combination…"
                className="mt-2 w-full bg-transparent border border-white/20 px-3 py-2 text-sm text-[#EDE0C8] placeholder:text-white/20 focus:outline-none focus:border-[#B5614A] transition-colors"
              />
            )}
          </div>

          {/* Error */}
          {errorMsg && (
            <p className="text-[11px] text-[#B5614A] border border-[#B5614A]/30 px-3 py-2">{errorMsg}</p>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2 pb-10">
            <button
              onClick={submit}
              disabled={status === 'loading'}
              className="px-8 py-3.5 bg-[#EDE0C8] text-[#1a1a1a] text-[12px] font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Saving…' : 'Add to Collection'}
            </button>
            {!hasGarments && (
              <p className="text-[10px] text-white/30">No garment images — fabric will appear without a detail view</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
