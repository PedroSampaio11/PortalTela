import { useSyncExternalStore } from 'react'

/**
 * Tamanho de projeto das telas de autenticação (px). A altura é a do frame do Figma e é a do estado
 * mais alto (cadastro com erros: medido em 1024px). A largura mínima é o `breakpoint/desktop`.
 */
export const FIT_DESIGN = { width: 1024, height: 1024 } as const

function compute(): number {
  const scale = Math.min(1, window.innerHeight / FIT_DESIGN.height, window.innerWidth / FIT_DESIGN.width)
  return Math.round(scale * 10_000) / 10_000
}

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback)
  window.visualViewport?.addEventListener('resize', callback)
  return () => {
    window.removeEventListener('resize', callback)
    window.visualViewport?.removeEventListener('resize', callback)
  }
}

/**
 * Fator (até 1) que faz o palco de 1024 de altura caber na janela SEM rolagem: janela do tamanho do
 * projeto ou maior = 1 (idêntico ao Figma); janela menor = o palco inteiro reduz na mesma proporção.
 */
export function useFitScale(): number {
  return useSyncExternalStore(subscribe, compute, () => 1)
}
