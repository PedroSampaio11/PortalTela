import { useEffect, useRef } from 'react'
import styles from './AuthHeader.module.css'

interface AuthHeaderProps {
  /** Figma `Title` (title/2xl/bold, 36). */
  title: string
  /** Figma `Description`. */
  description?: string
  /** Reserva a altura de N linhas da descrição (a etapa do código troca de texto ao bloquear: a tela não pula). */
  descriptionLines?: number
}

// Só move o foco em trocas de tela/etapa, não no primeiro carregamento da página. A marca é posta
// num timeout para o StrictMode (que roda o efeito duas vezes na montagem) não contar como "troca".
let hasRendered = false

/**
 * `AuthHeader` do DS (3048:77401). É o `h1` da tela: a cada nova etapa o foco vai para ele,
 * como manda a regra de foco em SPA (accessible-component-patterns, keyboard-and-focus).
 */
export function AuthHeader({ title, description, descriptionLines }: AuthHeaderProps) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // Se a etapa já pôs o foco num campo (ex.: primeira casa do código), não tira dele.
    const active = document.activeElement
    const fieldAlreadyFocused = active !== null && active !== document.body && active !== ref.current
    if (hasRendered && !fieldAlreadyFocused) ref.current?.focus({ preventScroll: true })
    const id = window.setTimeout(() => {
      hasRendered = true
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    document.title = `${title} | Portal Tela`
  }, [title])

  return (
    <div className={styles.header}>
      <h1 ref={ref} tabIndex={-1} className={styles.title}>
        {title}
      </h1>
      {description && (
        <p className={styles.description} style={descriptionLines ? { minHeight: `calc(${descriptionLines} * 1.5em)` } : undefined}>
          {description}
        </p>
      )}
    </div>
  )
}
