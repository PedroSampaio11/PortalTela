import { useEffect, useRef } from 'react'
import styles from './AuthHeader.module.css'

interface AuthHeaderProps {
  /** Figma `Title` (title/2xl/bold, 36). */
  title: string
  /** Figma `Description`. */
  description?: string
}

// Só move o foco em trocas de tela/etapa, não no primeiro carregamento da página.
let hasRendered = false

/**
 * `AuthHeader` do DS (3048:77401). É o `h1` da tela: a cada nova etapa o foco vai para ele,
 * como manda a regra de foco em SPA (accessible-component-patterns, keyboard-and-focus).
 */
export function AuthHeader({ title, description }: AuthHeaderProps) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (hasRendered) ref.current?.focus({ preventScroll: true })
    hasRendered = true
  }, [])

  useEffect(() => {
    document.title = `${title} | Portal Tela`
  }, [title])

  return (
    <div className={styles.header}>
      <h1 ref={ref} tabIndex={-1} className={styles.title}>
        {title}
      </h1>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  )
}
