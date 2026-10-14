import person1Character from '@/assets/images/person-1-character.webp'
import person1Motion from '@/assets/images/person-1-motion.webp'
import person1Plate from '@/assets/images/person-1-plate.webp'
import person2Character from '@/assets/images/person-2-character.webp'
import person2Motion from '@/assets/images/person-2-motion.webp'
import person2Plate from '@/assets/images/person-2-plate.webp'
import person3Character from '@/assets/images/person-3-character.webp'
import person3Motion from '@/assets/images/person-3-motion.webp'
import person3Plate from '@/assets/images/person-3-plate.webp'
import person4Character from '@/assets/images/person-4-character.webp'
import person4Motion from '@/assets/images/person-4-motion.webp'
import person4Plate from '@/assets/images/person-4-plate.webp'
import meta from '@/assets/images/scenes.json'

/**
 * Cenas do painel da marca: os quadros "Person 1 a 4" do Figma. Cada cena tem 3 camadas (geradas por
 * `npm run images` a partir de design-source/):
 *  - plate:      a cena, sem pessoa
 *  - character:  a personagem em PNG 24 bits (aparece junto com a cena)
 *  - motion:     a animação do Figma (figura inteira, todos os quadros), no mesmo enquadramento
 */
export const SCENE_IDS = ['person-1', 'person-2', 'person-3', 'person-4'] as const
export type SceneId = (typeof SCENE_IDS)[number]

export interface Scene {
  id: SceneId
  plate: string
  character: string
  motion: string
  /** Proporção da arte (largura / altura): define o enquadramento "cobrir". */
  width: number
  height: number
  /** Onde a animação fica na arte, em px da arte original. */
  motionBox: { x: number; y: number; width: number; height: number }
}

export const SCENES: Record<SceneId, Scene> = {
  'person-1': { id: 'person-1', plate: person1Plate, character: person1Character, motion: person1Motion, width: meta['person-1'].width, height: meta['person-1'].height, motionBox: meta['person-1'].motion },
  'person-2': { id: 'person-2', plate: person2Plate, character: person2Character, motion: person2Motion, width: meta['person-2'].width, height: meta['person-2'].height, motionBox: meta['person-2'].motion },
  'person-3': { id: 'person-3', plate: person3Plate, character: person3Character, motion: person3Motion, width: meta['person-3'].width, height: meta['person-3'].height, motionBox: meta['person-3'].motion },
  'person-4': { id: 'person-4', plate: person4Plate, character: person4Character, motion: person4Motion, width: meta['person-4'].width, height: meta['person-4'].height, motionBox: meta['person-4'].motion },
}

export function isSceneId(value: unknown): value is SceneId {
  return typeof value === 'string' && (SCENE_IDS as readonly string[]).includes(value)
}

/**
 * Cena padrão de cada rota. O Figma troca a cena entre estados do mesmo fluxo e vem sendo editado; aqui fica
 * fixa por fluxo (Login e Recuperação: Person 4, o frame padrão de ambos; Cadastro: Person 2). Na demonstração
 * o guia pode trocar a cena (`override`), valendo para as 3 telas.
 */
export function sceneForPath(pathname: string, override?: SceneId | null): SceneId {
  if (override) return override
  return pathname.startsWith('/cadastro') ? 'person-2' : 'person-4'
}
