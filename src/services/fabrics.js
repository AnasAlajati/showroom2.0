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
    const ext  = file.name.split('.').pop().toLowerCase()
    const url  = await uploadFile(file, `garments/${fabricId}/${gender}/${uid()}.${ext}`)
    urls.push(url)
  }
  if (urls.length) {
    await updateDoc(doc(db, 'fabrics', fabricId), {
      [`garmentImages.${gender}`]: arrayUnion(...urls),
    })
  }
  return urls
}

export async function deleteGarmentImage(fabricId, gender, url) {
  try { await deleteObject(ref(storage, url)) } catch {}
  await updateDoc(doc(db, 'fabrics', fabricId), {
    [`garmentImages.${gender}`]: arrayRemove(url),
  })
}

export async function replaceTexture(fabricId, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const url = await uploadFile(file, `fabrics/${fabricId}/texture.${ext}`)
  await updateDoc(doc(db, 'fabrics', fabricId), { image: url })
  return url
}

export async function deleteFabric(fabricId) {
  await deleteDoc(doc(db, 'fabrics', fabricId))
}

export async function createFabric(fabric) {
  await setDoc(doc(db, 'fabrics', fabric.id), fabric)
}
