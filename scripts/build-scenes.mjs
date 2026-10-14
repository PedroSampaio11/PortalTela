// Gera as ilustrações das telas de autenticação a partir dos originais do Figma (design-source/<cena>/).
//
// O Figma entrega 3 camadas por cena: a CENA (plate, fundo sem pessoa), a PERSONAGEM (character, PNG 24 bits
// recortado) e uma ANIMAÇÃO (GIF de 256 cores). Só duas coisas se mexem de verdade no GIF: o cabelo e o brilho
// do celular; o resto é ruído de dither. Para não perder qualidade, o app usa:
//   1. plate.webp       cena em alta qualidade
//   2. character.webp   personagem sem perdas (aparece junto com a cena, sem "piscar")
//   3. motion.webp      recorte animado SÓ da região que se mexe (cabelo, mãos e celular): no miolo usa o
//                       quadro do GIF e nas bordas faz transição suave para a personagem em 24 bits, então
//                       não há emenda visível e todo o resto da personagem mantém a qualidade total
// Rode: npm run images
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(root, 'design-source')
const OUT = join(root, 'src/assets/images')
mkdirSync(OUT, { recursive: true })

const SCENES = ['login', 'signup']
const NOISE_LOW = 34 // abaixo disto, a variação entre quadros é ruído de dither (o corpo do GIF treme até ~30)
const NOISE_HIGH = 80 // acima disto, é movimento de verdade (cabelo, mãos e brilho do celular)
const BLUR_RADIUS = 5
const PAD = 6
const FRAME_MS = 40

const kb = (n) => `${(n / 1024).toFixed(0)} kB`
const smoothstep = (lo, hi, x) => {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)))
  return t * t * (3 - 2 * t)
}

/** Desfoque de caixa separável sobre um mapa Float32 w x h. */
function boxBlur(map, w, h, r) {
  const tmp = new Float32Array(map.length)
  const out = new Float32Array(map.length)
  for (let y = 0; y < h; y++) {
    let sum = 0
    for (let x = -r; x <= r; x++) sum += map[y * w + Math.min(w - 1, Math.max(0, x))]
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / (2 * r + 1)
      sum += map[y * w + Math.min(w - 1, x + r + 1)] - map[y * w + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / (2 * r + 1)
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }
  return out
}

const meta = {}

for (const scene of SCENES) {
  const dir = join(SOURCE, scene)
  const started = Date.now()

  // 1) Cena e personagem estáticas.
  await sharp(join(dir, 'plate.png')).removeAlpha().webp({ quality: 98, effort: 6, smartSubsample: true }).toFile(join(OUT, `${scene}-plate.webp`))
  await sharp(join(dir, 'character.png')).webp({ lossless: true, effort: 6 }).toFile(join(OUT, `${scene}-character.webp`))

  // 2) Movimento: o que realmente muda ao longo do GIF.
  const ch = await sharp(join(dir, 'character.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = ch.info.width
  const H = ch.info.height
  const gif = await sharp(join(dir, 'animation.gif'), { animated: true, limitInputPixels: false }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const pages = gif.info.pages
  const frameSize = W * H * 4
  if (gif.info.width !== W || gif.info.pageHeight !== H) throw new Error(`${scene}: GIF ${gif.info.width}x${gif.info.pageHeight} diferente da personagem ${W}x${H}`)

  // Caixa da personagem (limita o trabalho).
  let bx0 = W, bx1 = 0, by0 = H, by1 = 0
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (ch.data[(y * W + x) * 4 + 3] > 0) {
        if (x < bx0) bx0 = x
        if (x > bx1) bx1 = x
        if (y < by0) by0 = y
        if (y > by1) by1 = y
      }
  const bw = bx1 - bx0 + 1
  const bh = by1 - by0 + 1
  const idx = (f, x, y) => f * frameSize + ((by0 + y) * W + (bx0 + x)) * 4

  // Média por pixel e variação máxima (por canal) em relação à média.
  const ref = new Float32Array(bw * bh * 3)
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++)
      for (let c = 0; c < 3; c++) {
        let s = 0
        for (let f = 0; f < pages; f++) s += gif.data[idx(f, x, y) + c]
        ref[(y * bw + x) * 3 + c] = s / pages
      }
  const motion = new Float32Array(bw * bh)
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      if (ch.data[((by0 + y) * W + (bx0 + x)) * 4 + 3] === 0) continue
      let peak = 0
      for (let f = 0; f < pages; f++)
        for (let c = 0; c < 3; c++) peak = Math.max(peak, Math.abs(gif.data[idx(f, x, y) + c] - ref[(y * bw + x) * 3 + c]))
      motion[y * bw + x] = smoothstep(NOISE_LOW, NOISE_HIGH, peak)
    }
  // Halo suave: o movimento entra e sai gradualmente (sem emenda visível com a personagem estática).
  const blurred = boxBlur(motion, bw, bh, BLUR_RADIUS)
  const weight = blurred.map((v) => Math.min(1, v * 2))

  let px0 = bw, px1 = 0, py0 = bh, py1 = 0
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++)
      if (weight[y * bw + x] > 0.02) {
        if (x < px0) px0 = x
        if (x > px1) px1 = x
        if (y < py0) py0 = y
        if (y > py1) py1 = y
      }
  const rx = Math.max(0, bx0 + px0 - PAD)
  const ry = Math.max(0, by0 + py0 - PAD)
  const rw = Math.min(W, bx0 + px1 + PAD + 1) - rx
  const rh = Math.min(H, by0 + py1 + PAD + 1) - ry

  // Cena por baixo: os pixels transparentes do recorte recebem a cor dela. Com preto (0,0,0) a compressão
  // (subamostragem de cor) "vazaria" preto para as bordas da personagem.
  const plateRaw = await sharp(join(dir, 'plate.png')).removeAlpha().resize(W, H).raw().toBuffer()

  // Quadros do recorte: mistura da personagem em 24 bits com o quadro do GIF, pelo peso do movimento.
  const stack = Buffer.alloc(rw * rh * 4 * pages)
  let err = 0
  let errN = 0
  for (let f = 0; f < pages; f++) {
    for (let y = 0; y < rh; y++)
      for (let x = 0; x < rw; x++) {
        const gx = rx + x
        const gy = ry + y
        const o = f * rw * rh * 4 + (y * rw + x) * 4
        const co = (gy * W + gx) * 4
        const alpha = ch.data[co + 3]
        if (alpha === 0) {
          const po = (gy * W + gx) * 3
          stack[o] = plateRaw[po]
          stack[o + 1] = plateRaw[po + 1]
          stack[o + 2] = plateRaw[po + 2]
          continue
        }
        const wgt = weight[(gy - by0) * bw + (gx - bx0)]
        for (let c = 0; c < 3; c++) {
          stack[o + c] = Math.round(ch.data[co + c] * (1 - wgt) + gif.data[f * frameSize + co + c] * wgt)
        }
        stack[o + 3] = alpha
        if (f % 24 === 0) {
          err += Math.abs(stack[o] - gif.data[f * frameSize + co]) + Math.abs(stack[o + 1] - gif.data[f * frameSize + co + 1]) + Math.abs(stack[o + 2] - gif.data[f * frameSize + co + 2])
          errN += 3
        }
      }
  }

  await sharp(stack, { raw: { width: rw, height: rh * pages, channels: 4, pageHeight: rh } })
    .webp({ lossless: true, effort: 4, loop: 0, delay: Array(pages).fill(FRAME_MS), minSize: false, mixed: false })
    .toFile(join(OUT, `${scene}-motion.webp`))

  meta[scene] = { width: W, height: H, frames: pages, frameMs: FRAME_MS, motion: { x: rx, y: ry, width: rw, height: rh } }
  const sizes = ['plate', 'character', 'motion'].map((n) => `${n} ${kb(statSync(join(OUT, `${scene}-${n}.webp`)).size)}`).join(' | ')
  console.log(`${scene.padEnd(7)} ${sizes} | recorte animado ${rw}x${rh} em (${rx},${ry}) = ${((rw * rh) / (W * H) * 100).toFixed(1)}% do quadro | dif. média vs GIF ${(err / errN).toFixed(2)} | ${((Date.now() - started) / 1000).toFixed(1)}s`)
}

writeFileSync(join(OUT, 'scenes.json'), JSON.stringify(meta, null, 2) + '\n')
