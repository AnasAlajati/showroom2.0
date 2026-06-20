import { useState, useMemo, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GROUPS } from './data/fabrics'
import { fetchFabrics } from './services/fabrics'
import LookbookHeader from './components/LookbookHeader'
import GroupTabs from './components/GroupTabs'
import FabricCard from './components/FabricCard'
import FabricDetail from './components/FabricDetail'
import ColorPalette from './components/ColorPalette'
import LandingPage from './components/LandingPage'
import MergeTool from './components/MergeTool'
import AddFabric from './components/AddFabric'
import { useAdmin, AdminLoginModal, AdminPanel } from './components/AdminLogin'
import AdminMigrate from './components/AdminMigrate'
import AdminFirebaseTest from './components/AdminFirebaseTest'
import './index.css'

export default function App() {
  const { isAdmin, login, logout } = useAdmin()

  const [fabrics,     setFabrics]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState('landing')
  const [activeGroup, setActiveGroup] = useState('all')
  const [selected,    setSelected]    = useState(null)
  const [showColors,  setShowColors]  = useState(false)
  const [showLogin,   setShowLogin]   = useState(false)
  const [showAdmin,   setShowAdmin]   = useState(false)
  const [showMerge,   setShowMerge]   = useState(false)
  const [showAdd,     setShowAdd]     = useState(false)
  const [showMigrate, setShowMigrate] = useState(false)
  const [showFbTest,  setShowFbTest]  = useState(false)

  useEffect(() => {
    fetchFabrics()
      .then(setFabrics)
      .catch(e => console.error('Firestore load failed:', e))
      .finally(() => setLoading(false))
  }, [])

  const displayed = useMemo(() => {
    const base = activeGroup === 'all' ? fabrics : fabrics.filter(f => f.group === activeGroup)
    const cnt  = f => Object.values(f.garmentImages ?? {}).reduce((s, a) => s + a.length, 0)
    return [...base].sort((a, b) => cnt(b) - cnt(a))
  }, [activeGroup, fabrics])

  function removeFabric(id) {
    setFabrics(prev => prev.filter(f => f.id !== id))
  }

  function goToLookbook(group) {
    if (group && group !== 'all') setActiveGroup(group)
    setPage('lookbook')
  }

  function handleAdminClick() {
    if (isAdmin) setShowAdmin(true)
    else setShowLogin(true)
  }

  if (showMerge)   return <MergeTool onClose={() => setShowMerge(false)} />
  if (showAdd)     return <AddFabric onClose={() => { setShowAdd(false); fetchFabrics().then(setFabrics) }} />
  if (showMigrate) return <AdminMigrate onClose={() => { setShowMigrate(false); fetchFabrics().then(setFabrics) }} />
  if (showFbTest)  return <AdminFirebaseTest onClose={() => setShowFbTest(false)} />
  if (showAdmin)   return (
    <AdminPanel
      onAdd={() => { setShowAdmin(false); setShowAdd(true) }}
      onMerge={() => { setShowAdmin(false); setShowMerge(true) }}
      onMigrate={() => { setShowAdmin(false); setShowMigrate(true) }}
      onTest={() => { setShowAdmin(false); setShowFbTest(true) }}
      onLogout={() => { logout(); setShowAdmin(false) }}
      onClose={() => setShowAdmin(false)}
    />
  )

  return (
    <>
      <AnimatePresence>
        {showLogin && (
          <AdminLoginModal
            onLogin={pw => login(pw)}
            onClose={() => setShowLogin(false)}
          />
        )}
      </AnimatePresence>

      {page === 'landing' ? (
        <>
          <LandingPage
            onEnter={() => goToLookbook()}
            onFamilies={(group) => goToLookbook(group)}
            onPalette={() => setShowColors(true)}
            isAdmin={isAdmin}
            onAdminClick={handleAdminClick}
            fabrics={fabrics}
          />
          <AnimatePresence>
            {showColors && (
              <motion.div key="colors" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'tween', duration: 0.28 }} className="fixed inset-0 z-50">
                <ColorPalette onClose={() => setShowColors(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="min-h-screen bg-[#111]">
          <LookbookHeader
            onHome={() => setPage('landing')}
            displayed={displayed.length}
            activeGroup={activeGroup}
            totalLooks={fabrics.reduce((s, f) => s + Object.values(f.garmentImages ?? {}).reduce((n, a) => n + a.length, 0), 0)}
            isAdmin={isAdmin}
            fbConnected={!loading && fabrics.length > 0}
          />
          <GroupTabs active={activeGroup} onChange={setActiveGroup} />

          <main className="px-6 sm:px-10 pt-8 pb-24">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 border-2 border-white/20 border-t-[#EDE0C8] rounded-full animate-spin" />
              </div>
            ) : (
              <motion.div key={activeGroup} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {displayed.map((fabric, i) => (
                  <motion.div key={fabric.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}>
                    <FabricCard fabric={fabric} onClick={setSelected} isAdmin={isAdmin}
                      onDelete={removeFabric} priority={i < 4} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </main>

          <AnimatePresence>
            {selected && (
              <motion.div key="detail" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.28 }} className="fixed inset-0 z-50">
                <FabricDetail
                  fabric={selected}
                  onClose={(next) => setSelected(next ?? null)}
                  isAdmin={isAdmin}
                  onDeleted={() => {
                    removeFabric(selected.id)
                    setSelected(null)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showColors && (
              <motion.div key="colors" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'tween', duration: 0.28 }} className="fixed inset-0 z-50">
                <ColorPalette onClose={() => setShowColors(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}
