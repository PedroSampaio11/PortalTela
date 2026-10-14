import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './Reveal.module.css'

interface RevealProps {
  open: boolean
  /** Espaçamento (gap) do contêiner pai: o item recolhido ocupa 0 de verdade, sem "pulo" ao abrir. */
  gap?: string
  children: ReactNode
}

/** Duração do recolhimento: igual a `--duration-layout-base` (300ms), para desmontar depois da animação. */
const EXIT_MS = 300

/**
 * Mostra e esconde conteúdo com altura e opacidade animadas, SEM deslocar o layout de uma vez.
 *
 * O contêiner pai usa `gap`; um item recolhido ficaria somando esse gap mesmo vazio. Por isso o
 * item fechado recebe margem negativa igual ao gap (soma zero) e a margem anima junto com a altura.
 * Quem usa precisa manter o conteúdo estável enquanto fecha (ver `useRetained`).
 */
export function Reveal({ open, gap = 'var(--component-lg)', children }: RevealProps) {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(open)

  // Abrir: monta já (derivado durante o render) e abre no quadro seguinte para a transição rodar.
  if (open && !mounted) setMounted(true)

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(id)
    }
    const id = window.setTimeout(() => {
      setMounted(false)
      setEntered(false)
    }, EXIT_MS)
    return () => window.clearTimeout(id)
  }, [open])

  if (!mounted) return null
  return (
    <div className={styles.reveal} data-open={(open && entered) || undefined} style={{ '--reveal-gap': gap } as React.CSSProperties}>
      <div className={styles.inner}>{children}</div>
    </div>
  )
}
