// Gera as ilustrações das telas de autenticação a partir dos originais do Figma (design-source/<cena>/).
//
// O Figma entrega 3 camadas por cena: a CENA (plate, fundo sem pessoa), a PERSONAGEM (character, PNG 24 bits
// recortado) e uma ANIMAÇÃO (GIF de 256 cores com a figura inteira, que se move de leve por completo: cabelo,
// rosto, torso, mãos e brilho do celular). O app reproduz exatamente isso:
//   1. plate.webp       cena em alta qualidade
//   2. character.webp   personagem sem perdas (aparece junto com a cena, sem "piscar", e é o que vale com
//                       "reduzir movimento")
//   3. motion.webp      os 97 quadros do GIF, COMPLETOS, no recorte mínimo da figura. Nada é congelado nem
//                       misturado com a personagem estática: o que se mexe no Figma se mexe aqui, junto.
// Rode: npm run images
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(root, 'design-source')
const OUT = join(root, 'src/assets/images')
mkdirSync(OUT, { recursive: true })

// Os nomes são os dos quadros do Figma (Person 1 a 4). A pasta de origem é design-source/<cena>/.
const SCENES = ['person-1', 'person-2', 'person-3', 'person-4']
const PAD = 2
const FRAME_MS = 40
const WEBP_QUALITY = 92

const kb = (n) => `${(n / 1024).toFixed(0)} kB`
const meta = {}

for (const scene of SCENES) {
  const dir = join(SOURCE, scene)
  const started = Date.now()

  // 1) Cena e personagem estáticas. A personagem manda no enquadramento; se a cena vier com outro tamanho
  //    (Person 3: 1440 x 1026), ela entra como no Figma (object-cover, centralizada): corte, sem reamostrar.
  const character = await sharp(join(dir, 'character.png')).metadata()
  await sharp(join(dir, 'plate.png'))
    .removeAlpha()
    .resize(character.width, character.height, { fit: 'cover', position: 'centre' })
    .webp({ quality: 98, effort: 6, smartSubsample: true })
    .toFile(join(OUT, `${scene}-plate.webp`))
  await sharp(join(dir, 'character.png')).webp({ lossless: true, effort: 6 }).toFile(join(OUT, `${scene}-character.webp`))

  // 2) Animação: todos os quadros do GIF, recortados na caixa que cobre a figura em qualquer quadro.
  const gif = await sharp(join(dir, 'animation.gif'), { animated: true, limitInputPixels: false }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const pages = gif.info.pages
  const W = gif.info.width
  const H = gif.info.pageHeight
  const frameSize = W * H * 4
  const still = await sharp(join(dir, 'character.png')).metadata()
  if (still.width !== W || still.height !== H) throw new Error(`${scene}: GIF ${W}x${H} diferente da personagem ${still.width}x${still.height}`)

  let x0 = W, x1 = 0, y0 = H, y1 = 0
  for (let f = 0; f < pages; f++)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (gif.data[f * frameSize + (y * W + x) * 4 + 3] > 0) {
          if (x < x0) x0 = x
          if (x > x1) x1 = x
          if (y < y0) y0 = y
          if (y > y1) y1 = y
        }
  const rx = Math.max(0, x0 - PAD)
  const ry = Math.max(0, y0 - PAD)
  const rw = Math.min(W, x1 + PAD + 1) - rx
  const rh = Math.min(H, y1 + PAD + 1) - ry

  const stack = Buffer.alloc(rw * rh * 4 * pages)
  for (let f = 0; f < pages; f++)
    for (let y = 0; y < rh; y++) {
      const from = f * frameSize + ((ry + y) * W + rx) * 4
      gif.data.copy(stack, f * rw * rh * 4 + y * rw * 4, from, from + rw * 4)
    }

  await sharp(stack, { raw: { width: rw, height: rh * pages, channels: 4, pageHeight: rh } })
    .webp({ quality: WEBP_QUALITY, alphaQuality: 100, smartSubsample: true, effort: 5, loop: 0, delay: Array(pages).fill(FRAME_MS), minSize: false, mixed: false })
    .toFile(join(OUT, `${scene}-motion.webp`))

  meta[scene] = { width: W, height: H, frames: pages, frameMs: FRAME_MS, motion: { x: rx, y: ry, width: rw, height: rh } }
  const sizes = ['plate', 'character', 'motion'].map((n) => `${n} ${kb(statSync(join(OUT, `${scene}-${n}.webp`)).size)}`).join(' | ')
  console.log(`${scene.padEnd(7)} ${sizes} | animação ${rw}x${rh} em (${rx},${ry}) = ${((rw * rh) / (W * H) * 100).toFixed(1)}% do quadro, ${pages} quadros | ${((Date.now() - started) / 1000).toFixed(1)}s`)
}

writeFileSync(join(OUT, 'scenes.json'), JSON.stringify(meta, null, 2) + '\n')
