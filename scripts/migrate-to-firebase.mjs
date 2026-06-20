/**
 * One-time migration: uploads all existing images to Firebase Storage
 * and creates Firestore documents for every fabric.
 *
 * Setup:
 *  1. Firebase console → Project Settings → Service Accounts → Generate new private key
 *  2. Save the downloaded JSON as  scripts/serviceAccount.json
 *  3. In Firebase console, set Firestore + Storage rules to "test mode" (allow all)
 *  4. Run:  node scripts/migrate-to-firebase.mjs
 */

import admin        from 'firebase-admin'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')

// ── Load service account ─────────────────────────────────────
const saPath = join(__dirname, 'serviceAccount.json')
if (!existsSync(saPath)) {
  console.error('❌  scripts/serviceAccount.json not found.')
  console.error('    Download it from: Firebase console → Project Settings → Service Accounts')
  process.exit(1)
}
const serviceAccount = JSON.parse(await readFile(saPath, 'utf8'))

admin.initializeApp({
  credential:    admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
})

const db     = admin.firestore()
const bucket = admin.storage().bucket()

// ── Load existing fabric data ────────────────────────────────
const { FABRICS } = await import('../src/data/fabrics.js')

function storagePath(localPublicPath) {
  // e.g. /fabrics/01_RIB/SB-FINE-RIB.jpeg  →  fabrics/01_RIB/SB-FINE-RIB.jpeg
  return localPublicPath.replace(/^\//, '')
}

function firebaseUrl(bucketName, path) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`
}

async function uploadImage(localPath, destPath) {
  if (!existsSync(localPath)) {
    console.log(`     ⚠  missing locally: ${localPath}`)
    return null
  }
  const [file] = await bucket.upload(localPath, {
    destination: destPath,
    resumable:   false,
    metadata:    {
      contentType: localPath.match(/\.png$/i) ? 'image/png'
                 : localPath.match(/\.webp$/i) ? 'image/webp'
                 : 'image/jpeg',
    },
  })
  return firebaseUrl(bucket.name, file.name)
}

// ── Migrate ──────────────────────────────────────────────────
let done = 0, skipped = 0

for (const fabric of FABRICS) {
  process.stdout.write(`[${++done}/${FABRICS.length}] ${fabric.id} ... `)

  // Check if doc already exists
  const docRef = db.collection('fabrics').doc(fabric.id)
  const snap   = await docRef.get()
  if (snap.exists) {
    console.log('already migrated, skipping')
    skipped++
    continue
  }

  // Upload texture image
  const texLocal   = join(root, 'public', storagePath(fabric.image))
  const texDest    = storagePath(fabric.image)
  const textureUrl = await uploadImage(texLocal, texDest) ?? fabric.image

  // Upload garment images
  const garmentImages = {}
  for (const [gender, paths] of Object.entries(fabric.garmentImages ?? {})) {
    garmentImages[gender] = []
    for (const p of paths) {
      const localPath = join(root, 'public', storagePath(p))
      const dest      = storagePath(p)
      const url       = await uploadImage(localPath, dest)
      if (url) garmentImages[gender].push(url)
    }
  }

  // Write Firestore document
  await docRef.set({
    ...fabric,
    image: textureUrl,
    garmentImages,
  })

  console.log(`✓  texture + ${Object.values(garmentImages).flat().length} garment images`)
}

console.log(`\nDone. ${done - skipped} migrated, ${skipped} already existed.`)
process.exit(0)
