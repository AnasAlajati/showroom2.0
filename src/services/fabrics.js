import { db, storage } from '../firebase'
import {
  collection, getDocs, doc,
  updateDoc, deleteDoc, setDoc,
  arrayUnion, arrayRemove,
} from 'firebase/firestore'
import {
  ref, uploadBytes, getDownloadURL, deleteObject,
} from 'firebase/storage'

function imgCount(f) {
  return Object.values(f.garmentImages ?? {}).reduce((s, a) => s + a.length, 0)
}

export async function fetchFabrics() {
  const snap = await getDocs(collection(db, 'fabrics'))
  const all  = snap.docs.map(d => ({ ...d.data(), id: d.id }))
  return all.sort((a, b) => imgCount(b) - imgCount(a))
}

async function uploadFile(file, path) {
  const r    = ref(storage, path)
  const snap = await uploadBytes(r, file)
  return getDownloadURL(snap.ref)
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export async function addGarmentImages(fabricId, gender, files) {
  const urls = []
  for (const file of Array.from(files)) {
    const ext = file.name.split('.').pop().toLowerCase()
    const url = await uploadFile(file, `garments/${fabricId}/${gender}/${uid()}.${ext}`)
    urls.push(url)
  }
  if (urls.length) {
    await updateDoc(doc(db, 'fabrics', fabricId), {
      [`garmentImages.${gender}`]: arrayUnion(...urls),
    })
  }
  return urls
}

function storagePathFromUrl(url) {
  try {
    const match = new URL(url).pathname.match(/\/o\/(.+)$/)
    if (match) return decodeURIComponent(match[1])
  } catch {}
  return url
}

export async function deleteGarmentImage(fabricId, gender, url) {
  try {
    await deleteObject(ref(storage, storagePathFromUrl(url)))
  } catch (e) {
    console.warn('Storage delete failed (file may already be gone):', e.message)
  }
  await updateDoc(doc(db, 'fabrics', fabricId), {
    [`garmentImages.${gender}`]: arrayRemove(url),
  })
}

export async function replaceTexture(fabricId, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const url = await uploadFile(file, `fabrics/${fabricId}/texture.${ext}`)
  // merge:true so it works even if something about the doc is unexpected
  await setDoc(doc(db, 'fabrics', fabricId), { image: url }, { merge: true })
  return url
}

export async function deleteFabric(fabricId) {
  await deleteDoc(doc(db, 'fabrics', fabricId))
}

export async function createFabric(fabric) {
  await setDoc(doc(db, 'fabrics', fabric.id), fabric)
}

// merge:true = safe update whether or not the doc already has all fields
export async function updateFabricField(fabricId, field, value) {
  await setDoc(doc(db, 'fabrics', fabricId), { [field]: value }, { merge: true })
}

export async function updateFabric(fabricId, fields) {
  await setDoc(doc(db, 'fabrics', fabricId), fields, { merge: true })
}

export async function reorderGarmentImages(fabricId, gender, orderedUrls) {
  // updateDoc with dot-notation key replaces the array in-place
  await updateDoc(doc(db, 'fabrics', fabricId), {
    [`garmentImages.${gender}`]: orderedUrls,
  })
}
