// Gera src/styles/tokens.css a partir de tokens/figma-tokens.json.
// Regra do DS (design-token-standard §8): "/" vira "-", tudo minúsculo, sem tradução manual.
// Dark mode = atributo data-theme="dark" no <html> (os Modes do Figma, §2).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = JSON.parse(readFileSync(resolve(root, 'tokens/figma-tokens.json'), 'utf8'))

const cssName = (figmaName) => '--' + figmaName.replace(/\//g, '-').toLowerCase()
const px = (n) => (n === 0 ? '0' : `${n}px`)

const seen = new Map()
const declare = (figmaName, value, lines) => {
  const name = cssName(figmaName)
  if (seen.has(name)) {
    throw new Error(`Colisão de nome CSS: "${figmaName}" e "${seen.get(name)}" geram ${name}`)
  }
  seen.set(name, figmaName)
  lines.push(`  ${name}: ${value};`)
}

const light = []
const dark = []

for (const [name, [l, d]] of Object.entries(source.color)) {
  declare(name, l, light)
  if (d !== l) dark.push(`  ${cssName(name)}: ${d};`)
}
for (const group of ['spacing', 'radius', 'border', 'icon', 'breakpoint', 'component']) {
  for (const [name, value] of Object.entries(source[group])) declare(name, px(value), light)
}
for (const [name, value] of Object.entries(source.motion)) declare(name, value, light)

// Tipografia: Text Styles do Figma. Em código viram o shorthand `font` (um token por estilo).
light.push(`  --font-display: '${source.fonts.display} Variable', '${source.fonts.display}', system-ui, sans-serif;`)
light.push(`  --font-body: '${source.fonts.body} Variable', '${source.fonts.body}', system-ui, sans-serif;`)
light.push(`  --font-serif: '${source.fonts.serif} Variable', '${source.fonts.serif}', Georgia, serif;`)
for (const [name, t] of Object.entries(source.typography)) {
  if (name.startsWith('$')) continue
  const family = `var(--font-${t.family})`
  declare(`type/${name}`, `${t.weight} ${t.size}px/${t.lineHeight} ${family}`, light)
}
for (const [name, value] of Object.entries(source.elevation)) {
  if (name.startsWith('$')) continue
  declare(name, value, light)
}

const css = `/* GERADO por scripts/generate-tokens.mjs a partir de tokens/figma-tokens.json.
 * NUNCA editar à mão (design-token-standard §8). Rode: npm run tokens */
:root {
${light.join('\n')}
}

[data-theme='dark'] {
${dark.join('\n')}
}
`

const out = resolve(root, 'src/styles/tokens.css')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, css)
console.log(`tokens.css: ${seen.size} tokens (${dark.length} com valor Dark)`)
