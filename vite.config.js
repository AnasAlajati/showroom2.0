import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join, extname } from 'path'
import sharp from 'sharp'

// ── Dev-only: fabric upload API ───────────────────────────
function fabricUploadPlugin() {
  return {
    name: 'fabric-upload',
    apply: 'serve',
    configureServer(server) {
      // ── Delete a single garment image ──────────────────────
      server.middlewares.use('/api/delete-image', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{}') }
        let raw = ''; req.on('data', c => raw += c)
        req.on('end', async () => {
          try {
            const { imagePath } = JSON.parse(raw)
            const { unlink } = await import('fs/promises')
            // Delete file
            try { await unlink(join(process.cwd(), 'public', imagePath.replace(/^\//, ''))) } catch {}
            // Remove path from fabrics.js
            const fp  = join(process.cwd(), 'src', 'data', 'fabrics.js')
            let src   = await readFile(fp, 'utf8')
            const esc = imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            src = src.replace(new RegExp(`,\\s*['"]{1}${esc}['"]{1}`, 'g'), '')
            src = src.replace(new RegExp(`['"]{1}${esc}['"]{1}\\s*,\\s*`, 'g'), '')
            src = src.replace(new RegExp(`['"]{1}${esc}['"]{1}`, 'g'), '')
            await writeFile(fp, src)
            res.end(JSON.stringify({ ok: true }))
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        })
      })

      // ── Delete an entire fabric entry ───────────────────────
      server.middlewares.use('/api/delete-fabric', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{}') }
        let raw = ''; req.on('data', c => raw += c)
        req.on('end', async () => {
          try {
            const { fabricId } = JSON.parse(raw)
            const fp  = join(process.cwd(), 'src', 'data', 'fabrics.js')
            let src   = await readFile(fp, 'utf8')

            // Find the id position (handles both ' and " quotes)
            let idPos = src.indexOf(`id: '${fabricId}'`)
            if (idPos < 0) idPos = src.indexOf(`"id": "${fabricId}"`)
            if (idPos < 0) { res.end(JSON.stringify({ ok: false, error: 'not found' })); return }

            // Walk back to opening {
            let start = idPos
            while (start > 0 && src[start] !== '{') start--
            let blockStart = start
            while (blockStart > 0 && (src[blockStart - 1] === ' ' || src[blockStart - 1] === '\n')) blockStart--
            if (blockStart > 0) blockStart++ // keep preceding newline

            // Walk forward with bracket counter to closing }
            let depth = 0, end = start
            for (; end < src.length; end++) {
              if (src[end] === '{') depth++
              else if (src[end] === '}') { depth--; if (depth === 0) break }
            }
            if (src[end + 1] === ',') end++
            if (src[end + 1] === '\n') end++

            src = src.slice(0, blockStart) + src.slice(end + 1)
            await writeFile(fp, src)
            res.end(JSON.stringify({ ok: true }))
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        })
      })

      // ── Replace / update the main fabric texture image ─────
      server.middlewares.use('/api/update-fabric-image', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{}') }
        let raw = ''; req.on('data', c => raw += c)
        req.on('end', async () => {
          try {
            const { fabricId, group, code, image } = JSON.parse(raw)
            const root   = process.cwd()
            const ext    = image.ext.toLowerCase().replace('jpg', 'jpeg')
            const buf    = Buffer.from(image.data, 'base64')
            const cBuf   = ext === 'png'
              ? await sharp(buf).resize({ width: 1400, withoutEnlargement: true }).png({ quality: 80, compressionLevel: 9 }).toBuffer()
              : await sharp(buf).resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()

            const newPath  = `/fabrics/${group}/${code}.${ext}`
            const filePath = join(root, 'public', 'fabrics', group, `${code}.${ext}`)
            await mkdir(join(root, 'public', 'fabrics', group), { recursive: true })
            await writeFile(filePath, cBuf)

            // Update the image field in fabrics.js if path changed
            const fp  = join(root, 'src', 'data', 'fabrics.js')
            let src   = await readFile(fp, 'utf8')
            src = src.replace(
              new RegExp(`(id:\\s*['"]${fabricId}['"][\\s\\S]*?image:\\s*)['"][^'"]+['"]`),
              `$1'${newPath}'`
            )
            await writeFile(fp, src)
            res.end(JSON.stringify({ ok: true, newPath }))
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        })
      })

      // Add garment images to an EXISTING fabric entry
      server.middlewares.use('/api/add-garment-images', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{}') }
        let raw = ''
        req.on('data', c => raw += c)
        req.on('end', async () => {
          try {
            const { fabricId, group, code, gender, images } = JSON.parse(raw)
            const root   = process.cwd()
            const label  = gender === 'kids' ? 'Children' : gender.charAt(0).toUpperCase() + gender.slice(1)
            const gDir   = join(root, 'public', 'garments', group, code, label)
            await mkdir(gDir, { recursive: true })

            // Find existing images to continue numbering
            const { readdir } = await import('fs/promises')
            let existing = []
            try { existing = await readdir(gDir) } catch {}
            const start = existing.filter(f => /\.(jpe?g|png)$/i.test(f)).length

            const paths = []
            for (let i = 0; i < images.length; i++) {
              const f    = images[i]
              const ext  = f.ext.toLowerCase().replace('jpg', 'jpeg')
              const fname = `${String(start + i + 1).padStart(2, '0')}.${ext}`
              const buf  = Buffer.from(f.data, 'base64')
              const cBuf = ext === 'png'
                ? await sharp(buf).resize({ width: 1400, withoutEnlargement: true }).png({ quality: 80, compressionLevel: 9 }).toBuffer()
                : await sharp(buf).resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
              await writeFile(join(gDir, fname), cBuf)
              paths.push(`/garments/${group}/${code}/${label}/${fname}`)
            }

            // Patch fabrics.js — robust bracket-counting approach
            const fabricsPath = join(root, 'src', 'data', 'fabrics.js')
            let src = await readFile(fabricsPath, 'utf8')
            const quoted = paths.map(p => `'${p}'`).join(', ')

            // 1. Locate the fabric entry by id (handles single OR double quotes)
            let idIdx = src.indexOf(`id: '${fabricId}'`)
            if (idIdx < 0) idIdx = src.indexOf(`"id": "${fabricId}"`)
            if (idIdx >= 0) {
              // 2. Find start of fabric object block
              let bStart = idIdx
              while (bStart > 0 && src[bStart] !== '{') bStart--

              // 3. Find end of fabric object using bracket counter
              let depth = 0, bEnd = bStart
              for (; bEnd < src.length; bEnd++) {
                if (src[bEnd] === '{') depth++
                else if (src[bEnd] === '}') { depth--; if (depth === 0) break }
              }

              let block = src.slice(bStart, bEnd + 1)

              // 4. Find or create garmentImages[gender] inside this block
              const gRe = new RegExp(`(${gender}\\s*:\\s*\\[)([^\\]]*)(\\])`)
              let newBlock
              if (gRe.test(block)) {
                // Extend existing gender array
                newBlock = block.replace(gRe, (_, open, content, close) => {
                  const c = content.trim()
                  return `${open}${c ? c + ', ' : ''}${quoted}${close}`
                })
              } else if (/garmentImages\s*:/.test(block)) {
                // garmentImages exists but not this gender — insert gender key
                newBlock = block.replace(/(garmentImages\s*:\s*\{)/, `$1\n      ${gender}: [${quoted}],`)
              } else {
                // No garmentImages at all — append before closing brace
                newBlock = block.slice(0, -1) + `,\n    garmentImages: {\n      ${gender}: [${quoted}],\n    },\n  }`
              }

              src = src.slice(0, bStart) + newBlock + src.slice(bEnd + 1)
            }

            await writeFile(fabricsPath, src)
            res.end(JSON.stringify({ ok: true, paths }))
          } catch (e) {
            console.error('[add-garment-images]', e)
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })

      server.middlewares.use('/api/upload-fabric', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{}') }

        let raw = ''
        req.on('data', c => raw += c)
        req.on('end', async () => {
          try {
            const data   = JSON.parse(raw)
            const root   = process.cwd()
            const pubDir = join(root, 'public')

            // Derive clean code + id from name
            const slug = data.name
              .replace(/[—–]/g, '-').replace(/[^a-zA-Z0-9\s-]/g, '')
              .trim().replace(/\s+/g, '-').toUpperCase()
            const id = slug.toLowerCase()

            // Paths
            const fabricDir  = join(pubDir, 'fabrics', data.group)
            const garmentDir = join(pubDir, 'garments', data.group, slug)
            await mkdir(fabricDir,  { recursive: true })
            await mkdir(garmentDir, { recursive: true })

            // Write + compress texture image
            const texBuf = Buffer.from(data.texture.data, 'base64')
            const texExt = data.texture.ext.toLowerCase().replace('jpg', 'jpeg')
            const texOut = join(fabricDir, `${slug}.${texExt}`)
            const compressed = texExt === 'png'
              ? await sharp(texBuf).resize({ width: 1400, withoutEnlargement: true }).png({ quality: 80, compressionLevel: 9 }).toBuffer()
              : await sharp(texBuf).resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
            await writeFile(texOut, compressed)

            // Write + compress garment images
            const garmentImages = {}
            const customers     = []
            for (const [gender, files] of Object.entries(data.garments ?? {})) {
              if (!files?.length) continue
              customers.push(gender)
              const label   = gender === 'kids' ? 'Children' : gender.charAt(0).toUpperCase() + gender.slice(1)
              const gDir    = join(garmentDir, label)
              await mkdir(gDir, { recursive: true })
              garmentImages[gender] = []
              for (let i = 0; i < files.length; i++) {
                const f      = files[i]
                const ext    = f.ext.toLowerCase().replace('jpg', 'jpeg')
                const fname  = `${String(i + 1).padStart(2, '0')}.${ext}`
                const buf    = Buffer.from(f.data, 'base64')
                const cBuf   = ext === 'png'
                  ? await sharp(buf).resize({ width: 1400, withoutEnlargement: true }).png({ quality: 80, compressionLevel: 9 }).toBuffer()
                  : await sharp(buf).resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
                await writeFile(join(gDir, fname), cBuf)
                garmentImages[gender].push(`/garments/${data.group}/${slug}/${label}/${fname}`)
              }
            }

            // Build new fabric JS entry
            const entry = {
              id,
              code: slug,
              name: data.name,
              group: data.group,
              image: `/fabrics/${data.group}/${slug}.${texExt}`,
              structure: data.structure || 'Knit fabric',
              gsm: data.gsm || '310–350',
              customers,
              garments: Object.fromEntries(
                customers.map(g => [g, data.garmentText?.[g] || ''])
              ),
              pantones: data.pantones || [],
              fleeseCombo: !!data.fleeseCombo,
              ...(data.fleeseNote ? { fleeseNote: data.fleeseNote } : {}),
              ...(Object.keys(garmentImages).length ? { garmentImages } : {}),
            }

            // Append to fabrics.js
            const fabricsPath = join(root, 'src', 'data', 'fabrics.js')
            let source = await readFile(fabricsPath, 'utf8')
            const insert = `\n  ${JSON.stringify(entry, null, 2).replace(/\n/g, '\n  ')},\n`
            source = source.replace(/\n\]\s*$/, `${insert}]`)
            await writeFile(fabricsPath, source)

            res.end(JSON.stringify({ ok: true, id, code: slug }))
          } catch (e) {
            console.error('[fabric-upload]', e)
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    fabricUploadPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'fabrics/**/*'],
      manifest: {
        name: 'Butterfly Showroom — Winter 2026',
        short_name: 'Showroom 2026',
        description: 'Winter 2026 fabric collection',
        theme_color: '#1a1a1a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'logo.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/fabrics\/.+\.(jpeg|jpg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fabric-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
