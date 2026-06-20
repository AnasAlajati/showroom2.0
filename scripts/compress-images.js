import sharp from 'sharp'
import { readdir, stat, readFile, writeFile } from 'fs/promises'
import { join, extname, resolve } from 'path'

const PUBLIC = resolve('public')
const MAX_W  = 1400
const MAX_H  = 1800
const Q_JPEG = 80
const Q_PNG  = 80

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) files.push(...await walk(full))
    else if (/\.(jpe?g|png)$/i.test(e.name)) files.push(full)
  }
  return files
}

async function compress(file) {
  const before = (await stat(file)).size
  const ext = extname(file).toLowerCase()

  let buf
  try {
    const input = await readFile(file)
    const img = sharp(input).resize({ width: MAX_W, height: MAX_H, fit: 'inside', withoutEnlargement: true })
    if (ext === '.png') {
      buf = await img.png({ quality: Q_PNG, compressionLevel: 9 }).toBuffer()
    } else {
      buf = await img.jpeg({ quality: Q_JPEG, mozjpeg: true }).toBuffer()
    }
  } catch (e) {
    console.log(`  SKIP (error) ${file.split('public')[1]} — ${e.message}`)
    return { before, after: before }
  }

  if (buf.length < before) {
    await writeFile(file, buf)
    const saved = Math.round((before - buf.length) / 1024)
    const pct   = Math.round((1 - buf.length / before) * 100)
    console.log(`  ${String(pct).padStart(2)}% ↓  ${Math.round(before/1024)}KB → ${Math.round(buf.length/1024)}KB   ${file.split('public\\')[1]}`)
    return { before, after: buf.length }
  }
  return { before, after: before }
}

const files = await walk(PUBLIC)
console.log(`Compressing ${files.length} images...\n`)

let totalBefore = 0, totalAfter = 0
for (const f of files) {
  const { before, after } = await compress(f)
  totalBefore += before
  totalAfter  += after
}

console.log(`\n─────────────────────────────────────────`)
console.log(`Before: ${(totalBefore/1024/1024).toFixed(1)} MB`)
console.log(`After:  ${(totalAfter /1024/1024).toFixed(1)} MB`)
console.log(`Saved:  ${((totalBefore-totalAfter)/1024/1024).toFixed(1)} MB  (${Math.round((1-totalAfter/totalBefore)*100)}%)`)
