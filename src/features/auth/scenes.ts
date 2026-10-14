import loginCharacter from '@/assets/images/login-character.webp'
import loginMotion from '@/assets/images/login-motion.webp'
import loginPlate from '@/assets/images/login-plate.webp'
import signupCharacter from '@/assets/images/signup-character.webp'
import signupMotion from '@/assets/images/signup-motion.webp'
import signupPlate from '@/assets/images/signup-plate.webp'
import meta from '@/assets/images/scenes.json'

/**
 * Cenas do painel da marca. Cada cena tem 3 camadas (geradas por `npm run images` a partir do Figma):
 *  - plate:      a cena, sem pessoa
 *  - character:  a personagem em PNG 24 bits (aparece junto com a cena)
 *  - motion:     a animação do Figma (figura inteira, todos os quadros), no mesmo enquadramento
 */
export type SceneId = 'balcony' | 'stairs'

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
  balcony: { id: 'balcony', plate: loginPlate, character: loginCharacter, motion: loginMotion, width: meta.login.width, height: meta.login.height, motionBox: meta.login.motion },
  stairs: { id: 'stairs', plate: signupPlate, character: signupCharacter, motion: signupMotion, width: meta.signup.width, height: meta.signup.height, motionBox: meta.signup.motion },
}

/**
 * Cena de cada rota. O Figma troca a cena entre estados do mesmo fluxo e vem sendo editado; aqui fica
 * fixa por fluxo (Login e Recuperação: varanda, o frame padrão de ambos; Cadastro: escadaria).
 */
export function sceneForPath(pathname: string): SceneId {
  return pathname.startsWith('/cadastro') ? 'stairs' : 'balcony'
}
