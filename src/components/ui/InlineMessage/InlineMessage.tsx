import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import styles from './InlineMessage.module.css'

export interface InlineMessageProps {
  /** Figma `Tone`. Hoje só `error` tem ícone no DS importado. */
  tone?: 'error'
  /** Figma `HasIcon`. Nos tons de status vale ligar, para a cor não ser o único sinal. */
  hasIcon?: boolean
  /** Figma `Title`. */
  title?: string
  children: ReactNode
  id?: string
  className?: string
}

/** `InlineMessage` do DS (2964:947): fundo suave, sem borda e sem sombra. */
export function InlineMessage({ tone = 'error', hasIcon = false, title, children, id, className }: InlineMessageProps) {
  return (
    <div id={id} className={cx(styles.root, className)} data-tone={tone} role={tone === 'error' ? 'alert' : 'status'}>
      {hasIcon && <Icon name="cancel-circle" size={20} className={styles.icon} />}
      <div className={styles.text}>
        {title && <p className={styles.title}>{title}</p>}
        <p className={styles.message}>{children}</p>
      </div>
    </div>
  )
}
