import { useState, useEffect, useRef } from 'react'
import { db, storage } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { FABRICS } from '../data/fabrics'

async function fetchBlob(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} fetching ${url.split('/').pop()}`)
  return res.blob()
}

export default function AdminMigrate({ onClose }) {
  const [phase,    setPhase]    = useState('idle')   // idle | running | done
  const [items,    setItems]    = useState([])        // { id, status, detail }
  const [current,  setCurrent]  = useState('')        // fabric currently uploading
  const [progress, setProgress] = useState(0)         // 0–100
  const [summary,  setSummary]  = useState(null)      // { migrated, skipped, errors }
  const logRef = useRef(null)

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [items, current])

  function setItem(id, status, detail = '') {
    setItems(prev => {
      const exists = prev.find(x => x.id === id)
      if (exists) return prev.map(x => x.id === id ? { ...x, status, detail } : x)
      return [...prev, { id, status, detail }]
    })
  }

  async function run() {
    setPhase('running'); setItems([]); setSummary(null); setProgress(0)
    let migrated = 0, skipped = 0, errors = 0
    const total = FABRICS.length

    for (let i = 0; i < FABRICS.length; i++) {
      const fabric = FABRICS[i]
      setProgress(Math.round((i / total) * 100))
      setCurrent(fabric.id)

      const snap = await getDoc(doc(db, 'fabrics', fabric.id))
      if (snap.exists()) {
        setItem(fabric.id, 'skipped', 'already in Firestore')
        skipped++
        continue
      }

      setItem(fabric.id, 'uploading', 'uploading texture…')

      try {
        const texBlob = await fetchBlob(fabric.image)
        const texExt  = fabric.image.split('.').pop()
        const texRef  = ref(storage, `fabrics/${fabric.id}/texture.${texExt}`)
        const texSnap = await uploadBytes(texRef, texBlob)
        const texUrl  = await getDownloadURL(texSnap.ref)

        const garmentImages = {}
        const allPaths = Object.entries(fabric.garmentImages ?? {})
        let imgDone = 0
        const imgTotal = allPaths.reduce((s, [, arr]) => s + arr.length, 0)

        for (const [gender, paths] of allPaths) {
          garmentImages[gender] = []
          for (const path of paths) {
            setItem(fabric.id, 'uploading', `garments ${++imgDone}/${imgTotal}`)
            const blob  = await fetchBlob(path)
            const fname = path.split('/').pop()
            const gRef  = ref(storage, `garments/${fabric.id}/${gender}/${fname}`)
            const gSnap = await uploadBytes(gRef, blob)
            garmentImages[gender].push(await getDownloadURL(gSnap.ref))
          }
        }

        setItem(fabric.id, 'uploading', 'saving to Firestore…')
        await setDoc(doc(db, 'fabrics', fabric.id), { ...fabric, image: texUrl, garmentImages })

        setItem(fabric.id, 'ok', `texture + ${imgTotal} images`)
        migrated++
      } catch (e) {
        setItem(fabric.id, 'error', e.message)
        errors++
      }
    }

    setProgress(100)
    setCurrent('')
    setSummary({ migrated, skipped, errors })
    setPhase('done')
  }

  const total    = FABRICS.length
  const doneCount = items.filter(x => x.status === 'ok' || x.status === 'skipped' || x.status === 'error').length

  return (
    <div className="fixed inset-0 z-[250] bg-[#0a0a08] flex flex-col text-[#EDE0C8]">

      {/* Header */}
      <div className="border-b border-white/10 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[9px] tracking-[0.3em] uppercase text-[#B5614A] mb-1">Admin → Migration</p>
          <h1 className="font-serif text-xl">Migrate to Firebase</h1>
        </div>
        <button onClick={onClose} disabled={phase === 'running'}
                className="text-white/30 hover:text-white disabled:opacity-20 text-xl px-2">✕</button>
      </div>

      {/* Idle intro */}
      {phase === 'idle' && (
        <div className="px-8 py-8 border-b border-white/10 space-y-3 flex-shrink-0">
          <p className="text-[12px] text-white/60 leading-relaxed max-w-lg">
            Uploads all <span className="text-[#EDE0C8] font-semibold">{total} fabrics</span> — textures + garment images — to Firebase Storage and creates Firestore documents. Already-migrated fabrics are skipped.
          </p>
          <p className="text-[10px] text-white/30">Make sure the dev server is running so local images are accessible.</p>
        </div>
      )}

      {/* Progress bar (running) */}
      {phase === 'running' && (
        <div className="px-8 pt-6 pb-4 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
            <span className="truncate max-w-[60%]">
              {current ? <><span className="text-white/60">Uploading</span> {current}</> : 'Starting…'}
            </span>
            <span>{doneCount} / {total}</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B5614A] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary (done) */}
      {phase === 'done' && summary && (
        <div className="px-8 py-6 flex-shrink-0 border-b border-white/10">
          <div className="flex gap-6">
            <Stat label="Migrated" value={summary.migrated} color="text-green-400" />
            <Stat label="Skipped"  value={summary.skipped}  color="text-white/40" />
            <Stat label="Failed"   value={summary.errors}   color={summary.errors ? 'text-red-400' : 'text-white/40'} />
          </div>
          <p className="mt-3 text-[11px]">
            {summary.errors === 0
              ? <span className="text-green-400">All fabrics saved to Firebase successfully.</span>
              : <span className="text-red-400">{summary.errors} fabric{summary.errors > 1 ? 's' : ''} failed — see log below. You can re-run to retry.</span>
            }
          </p>
        </div>
      )}

      {/* Log */}
      {items.length > 0 && (
        <div ref={logRef} className="flex-1 overflow-y-auto px-8 py-4 space-y-1 min-h-0">
          {items.map(item => (
            <div key={item.id} className="flex items-start gap-3 py-1 border-b border-white/5">
              <StatusDot status={item.status} />
              <div className="flex-1 min-w-0">
                <span className={`text-[11px] font-mono ${
                  item.status === 'ok'       ? 'text-white/80' :
                  item.status === 'error'    ? 'text-red-300'  :
                  item.status === 'skipped'  ? 'text-white/25' : 'text-white/50'
                }`}>{item.id}</span>
                {item.detail && (
                  <span className={`ml-2 text-[10px] ${
                    item.status === 'error' ? 'text-red-400' :
                    item.status === 'ok'    ? 'text-green-400/70' : 'text-white/25'
                  }`}>— {item.detail}</span>
                )}
              </div>
            </div>
          ))}
          {phase === 'running' && (
            <div className="flex items-center gap-2 pt-2">
              <span className="w-3 h-3 border-2 border-white/20 border-t-[#B5614A] rounded-full animate-spin flex-shrink-0" />
              <span className="text-[10px] text-white/30 animate-pulse">Working…</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-white/10 px-8 py-5 flex gap-3 flex-shrink-0">
        {phase === 'idle' && (
          <>
            <button onClick={run}
                    className="px-6 py-2.5 bg-[#EDE0C8] text-[#1a1a1a] text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-colors">
              Start Migration
            </button>
            <button onClick={onClose}
                    className="px-4 py-2.5 border border-white/15 text-[11px] text-white/40 hover:text-white/70 hover:border-white/30 transition-colors">
              Cancel
            </button>
          </>
        )}
        {phase === 'running' && (
          <p className="text-[10px] text-white/25 self-center">Do not close this page while migrating…</p>
        )}
        {phase === 'done' && (
          <>
            <button onClick={onClose}
                    className="px-6 py-2.5 bg-[#EDE0C8] text-[#1a1a1a] text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-colors">
              Done — Back to Admin
            </button>
            {summary?.errors > 0 && (
              <button onClick={run}
                      className="px-4 py-2.5 border border-white/15 text-[11px] text-white/50 hover:text-white hover:border-white/40 transition-colors">
                Retry Failed
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatusDot({ status }) {
  if (status === 'ok')       return <span className="mt-0.5 w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
  if (status === 'error')    return <span className="mt-0.5 w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
  if (status === 'skipped')  return <span className="mt-0.5 w-2 h-2 rounded-full bg-white/15 flex-shrink-0" />
  return <span className="mt-0.5 w-2 h-2 rounded-full border border-[#B5614A] flex-shrink-0 animate-pulse" />
}

function Stat({ label, value, color }) {
  return (
    <div>
      <p className={`text-2xl font-serif ${color}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-white/30 mt-0.5">{label}</p>
    </div>
  )
}
