import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import type { IconName } from '../Icon'
import styles from './InlineMessage.module.css'

export type InlineMessageTone = 'error' | 'info' | 'success' | 'warning'

export interface InlineMessageProps {
  /** Figma `Tone`. */
  tone?: InlineMessageTone
  /** Figma `HasIcon`. Nos tons de status vale ligar, para a cor não ser o único sinal. */
  hasIcon?: boolean
  /** Figma `Title`. */
  title?: string
  children: ReactNode
  id?: string
  className?: string
}

const ICONS: Record<InlineMessageTone, IconName> = {
  error: 'cancel-circle',
  info: 'information-circle',
  success: 'check-circle',
  warning: 'alert-01',
}

/** `InlineMessage` do DS (2964:947): fundo suave, sem borda e sem sombra. Erro e aviso são `alert`. */
export function InlineMessage({ tone = 'error', hasIcon = false, title, children, id, className }: InlineMessageProps) {
  return (
    <div
      id={id}
      className={cx(styles.root, className)}
      data-tone={tone}
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
    >
      {hasIcon && <Icon name={ICONS[tone]} size={20} className={styles.icon} />}
      <div className={styles.text}>
        {title && <p className={styles.title}>{title}</p>}
        <p className={styles.message}>{children}</p>
      </div>
    </div>
  )
}
