import { useState } from 'react'
import { db, storage } from '../firebase'
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const TEST_DOC_ID = 'firebase-connection-test'
const TEST_IMG_PATH = 'test/firebase-test-image'

export default function AdminFirebaseTest({ onClose }) {
  const [firestoreWrite, setFsWrite]  = useState(null) // null | 'loading' | 'ok' | 'error'
  const [firestoreRead,  setFsRead]   = useState(null)
  const [firestoreData,  setFsData]   = useState(null)
  const [firestoreErr,   setFsErr]    = useState('')

  const [storageImg,   setStorageImg]   = useState(null)  // null | 'loading' | 'ok' | 'error'
  const [storageUrl,   setStorageUrl]   = useState('')
  const [storageErr,   setStorageErr]   = useState('')

  const [cleanupMsg,   setCleanupMsg]   = useState('')

  // ── Firestore ──────────────────────────────────────────────
  async function testWrite() {
    setFsWrite('loading'); setFsErr('')
    try {
      await setDoc(doc(db, 'test', TEST_DOC_ID), {
        message: 'Hello from Butterfly Showroom',
        timestamp: new Date().toISOString(),
      })
      setFsWrite('ok')
    } catch (e) {
      setFsWrite('error'); setFsErr(e.message)
    }
  }

  async function testRead() {
    setFsRead('loading'); setFsErr('')
    try {
      const snap = await getDoc(doc(db, 'test', TEST_DOC_ID))
      if (!snap.exists()) throw new Error('Document not found — write first')
      setFsData(snap.data())
      setFsRead('ok')
    } catch (e) {
      setFsRead('error'); setFsErr(e.message)
    }
  }

  // ── Storage ────────────────────────────────────────────────
  async function testUpload(file) {
    setStorageImg('loading'); setStorageErr(''); setStorageUrl('')
    try {
      const ext  = file.name.split('.').pop()
      const sRef = ref(storage, `${TEST_IMG_PATH}.${ext}`)
      const snap = await uploadBytes(sRef, file)
      const url  = await getDownloadURL(snap.ref)
      setStorageUrl(url)
      setStorageImg('ok')
    } catch (e) {
      setStorageImg('error'); setStorageErr(e.message)
    }
  }

  // ── Cleanup ────────────────────────────────────────────────
  async function cleanup() {
    setCleanupMsg('Cleaning up…')
    const errs = []
    try { await deleteDoc(doc(db, 'test', TEST_DOC_ID)) } catch (e) { errs.push('Firestore: ' + e.message) }
    if (storageUrl) {
      try {
        const sRef = ref(storage, storageUrl)
        await deleteObject(sRef)
      } catch (e) {
        // try by path if URL ref fails
        try {
          const ext = storageUrl.match(/firebase-test-image\.(\w+)/)?.[1] ?? 'png'
          await deleteObject(ref(storage, `${TEST_IMG_PATH}.${ext}`))
        } catch { errs.push('Storage: ' + e.message) }
      }
    }
    setFsWrite(null); setFsRead(null); setFsData(null)
    setStorageImg(null); setStorageUrl('')
    setCleanupMsg(errs.length ? 'Errors: ' + errs.join(', ') : 'Cleaned up — test data removed')
  }

  const icon = s =>
    s === 'loading' ? <Spin /> :
    s === 'ok'      ? <span className="text-green-400">✓</span> :
    s === 'error'   ? <span className="text-red-400">✗</span>  : null

  return (
    <div className="fixed inset-0 z-[300] bg-[#0a0a08] flex flex-col text-[#EDE0C8]">
      {/* Header */}
      <div className="border-b border-white/10 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[9px] tracking-[0.3em] uppercase text-[#B5614A] mb-1">Admin → Firebase Test</p>
          <h1 className="font-serif text-xl">Connection Test</h1>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white text-xl px-2">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 max-w-xl">

        {/* ── Section 1: Firestore Write ── */}
        <Section label="1 — Firestore Write" status={firestoreWrite}>
          <p className="text-[11px] text-white/40 mb-3">
            Writes a test document to <code className="text-white/60">test/__firebase_test__</code>
          </p>
          <Btn onClick={testWrite} loading={firestoreWrite === 'loading'}>
            {icon(firestoreWrite)} Write Document
          </Btn>
          {firestoreWrite === 'ok' && (
            <p className="mt-2 text-[11px] text-green-400">Document written successfully</p>
          )}
        </Section>

        {/* ── Section 2: Firestore Read ── */}
        <Section label="2 — Firestore Read" status={firestoreRead}>
          <p className="text-[11px] text-white/40 mb-3">
            Reads the document back and displays it
          </p>
          <Btn onClick={testRead} loading={firestoreRead === 'loading'} disabled={firestoreWrite !== 'ok'}>
            {icon(firestoreRead)} Read Document
          </Btn>
          {firestoreData && (
            <pre className="mt-3 p-3 bg-white/5 text-[10px] text-green-300 font-mono border border-white/10 overflow-auto">
              {JSON.stringify(firestoreData, null, 2)}
            </pre>
          )}
        </Section>

        {/* Firestore error */}
        {firestoreErr && (
          <p className="text-[11px] text-red-400 border border-red-400/20 px-3 py-2">{firestoreErr}</p>
        )}

        {/* ── Section 3: Storage Upload + Fetch ── */}
        <Section label="3 — Storage Upload & Fetch" status={storageImg}>
          <p className="text-[11px] text-white/40 mb-3">
            Uploads an image to Firebase Storage and fetches the download URL
          </p>
          <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 border border-white/20 hover:border-white/40 transition-colors text-[11px] text-white/60 hover:text-white">
            <input type="file" accept="image/*" className="sr-only"
              onChange={e => e.target.files[0] && testUpload(e.target.files[0])} />
            {storageImg === 'loading' ? <Spin /> : '↑'} Pick Image to Upload
          </label>
          {storageErr && (
            <p className="mt-2 text-[11px] text-red-400">{storageErr}</p>
          )}
          {storageUrl && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] text-green-400">Image uploaded + fetched successfully</p>
              <img src={storageUrl} alt="test upload" className="max-w-[200px] max-h-[200px] object-contain border border-white/10" />
              <p className="text-[9px] text-white/20 break-all font-mono">{storageUrl}</p>
            </div>
          )}
        </Section>

        {/* ── Cleanup ── */}
        {(firestoreWrite === 'ok' || storageUrl) && (
          <div className="border-t border-white/10 pt-6">
            <p className="text-[10px] text-white/30 mb-3">Remove test data from Firebase when done</p>
            <Btn onClick={cleanup} variant="ghost">Delete Test Data</Btn>
            {cleanupMsg && <p className="mt-2 text-[10px] text-white/40">{cleanupMsg}</p>}
          </div>
        )}

      </div>
    </div>
  )
}

function Section({ label, status, children }) {
  const border =
    status === 'ok'    ? 'border-green-400/30' :
    status === 'error' ? 'border-red-400/30'   : 'border-white/10'
  return (
    <div className={`border ${border} p-5 transition-colors`}>
      <p className="text-[9px] uppercase tracking-widest text-white/30 mb-4">{label}</p>
      {children}
    </div>
  )
}

function Btn({ onClick, loading, disabled, variant, children }) {
  const base = 'flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
  const style = variant === 'ghost'
    ? 'border border-white/15 text-white/40 hover:text-white hover:border-white/40'
    : 'bg-[#EDE0C8] text-[#1a1a1a] font-bold hover:bg-white'
  return (
    <button onClick={onClick} disabled={loading || disabled} className={`${base} ${style}`}>
      {children}
    </button>
  )
}

function Spin() {
  return <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />
}
