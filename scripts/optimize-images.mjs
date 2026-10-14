// Converte as ilustrações originais do Figma (design-source/) em WebP otimizado (src/assets/images/).
// Cena estática: WebP com qualidade alta. Personagem animada: WebP animado com transparência.
// Rode: node scripts/optimize-images.mjs
import { readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'design-source')
const target = join(root, 'src/assets/images')

// A animação de Recuperação tem 145 quadros: q66 é visualmente igual a q82 (diferença média +0,07) e bem menor.
const ANIMATED_QUALITY = { 'recovery-animated': 66 }

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} kB`

for (const file of readdirSync(source).sort()) {
  const ext = extname(file)
  const name = file.slice(0, -ext.length)
  const input = join(source, file)
  const output = join(target, `${name}.webp`)
  const started = Date.now()

  if (ext === '.png') {
    await sharp(input).webp({ quality: 96, alphaQuality: 100, effort: 6, smartSubsample: true }).toFile(output)
  } else if (ext === '.gif') {
    await sharp(input, { animated: true, limitInputPixels: false })
      .webp({ quality: ANIMATED_QUALITY[name] ?? 82, alphaQuality: 92, effort: 5, loop: 0, minSize: false, mixed: false })
      .toFile(output)
  } else continue

  const before = statSync(input).size
  const after = statSync(output).size
  const meta = await sharp(output, { animated: true }).metadata()
  console.log(
    `${file.padEnd(24)} ${kb(before).padStart(8)} -> ${kb(after).padStart(7)}  (${((after / before) * 100).toFixed(0)}%)  ${meta.width}x${meta.pages ? meta.pageHeight : meta.height}  frames=${meta.pages ?? 1}  ${((Date.now() - started) / 1000).toFixed(1)}s`,
  )
}
