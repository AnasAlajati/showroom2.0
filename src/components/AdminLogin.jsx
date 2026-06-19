import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ADMIN_KEY = 'showroom_admin_v1'
const check = pw => btoa(pw) === btoa('Butterfly5345X')

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return localStorage.getItem(ADMIN_KEY) === btoa('Butterfly5345X') } catch { return false }
  })
  function login(pw) {
    if (!check(pw)) return false
    localStorage.setItem(ADMIN_KEY, btoa(pw))
    setIsAdmin(true)
    return true
  }
  function logout() {
    localStorage.removeItem(ADMIN_KEY)
    setIsAdmin(false)
  }
  return { isAdmin, login, logout }
}

// Tiny invisible-ish person icon for landing page
export function AdminIcon({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="opacity-20 hover:opacity-50 transition-opacity duration-300 p-1.5 cursor-pointer"
      aria-label="Admin"
      title=""
    >
      <svg className="w-4 h-4 text-[#c8b89a]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    </button>
  )
}

// Login modal
export function AdminLoginModal({ onLogin, onClose }) {
  const [pw,    setPw]    = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function attempt() {
    if (onLogin(pw)) { onClose() }
    else {
      setError(true); setPw('')
      setShake(true); setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: shake ? [1, 1.02, 0.98, 1.01, 1] : 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: shake ? 0.4 : 0.2 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#111] border border-white/10 p-8 w-80 flex flex-col gap-5"
      >
        <div>
          <p className="text-[9px] tracking-[0.3em] uppercase text-[#B5614A] mb-1">Restricted</p>
          <h2 className="font-serif text-lg text-[#EDE0C8]">Admin Access</h2>
        </div>

        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
          placeholder="Password"
          className={`w-full bg-transparent border px-3 py-2.5 text-sm text-[#EDE0C8] placeholder:text-white/20 focus:outline-none transition-colors ${
            error ? 'border-red-500/60' : 'border-white/20 focus:border-[#B5614A]'
          }`}
        />

        {error && <p className="text-[10px] text-red-400 -mt-3">Incorrect password</p>}

        <div className="flex gap-3">
          <button
            onClick={attempt}
            className="flex-1 py-2.5 bg-[#EDE0C8] text-[#1a1a1a] text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-colors"
          >
            Enter
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-white/15 text-[11px] text-white/40 hover:text-white/70 hover:border-white/30 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Admin panel page (shown when isAdmin)
export function AdminPanel({ onAdd, onMerge, onLogout, onClose }) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#0f0f0d] flex flex-col">
      <div className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[9px] tracking-[0.3em] uppercase text-[#B5614A] mb-1">Admin Panel</p>
          <h1 className="font-serif text-2xl text-[#EDE0C8]">Showroom Tools</h1>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white text-xl px-3">✕</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
        <AdminTile
          icon={<PlusIcon />}
          title="Add Fabric"
          desc="Upload new fabric texture + garment images"
          onClick={onAdd}
          accent
        />
        <AdminTile
          icon={<MergeIcon />}
          title="Merge Duplicates"
          desc="Combine Winter Essentials entries with existing fabrics"
          onClick={onMerge}
        />
        <button
          onClick={onLogout}
          className="mt-6 text-[10px] uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function AdminTile({ icon, title, desc, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      className={`w-full max-w-sm flex items-center gap-5 px-6 py-5 border transition-all text-left group ${
        accent
          ? 'border-[#EDE0C8]/30 hover:border-[#EDE0C8] hover:bg-[#EDE0C8]/5'
          : 'border-white/10 hover:border-white/30 hover:bg-white/5'
      }`}
    >
      <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${accent ? 'text-[#EDE0C8]' : 'text-white/40 group-hover:text-white/70'}`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold tracking-wide ${accent ? 'text-[#EDE0C8]' : 'text-white/70 group-hover:text-white'}`}>{title}</p>
        <p className="text-[10px] text-white/30 mt-0.5">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

function PlusIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
function MergeIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  )
}
