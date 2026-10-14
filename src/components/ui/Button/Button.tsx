import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import type { IconName } from '../Icon'
import styles from './Button.module.css'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  /** Figma `Style`. (`style` é reservado pelo React.) */
  variant?: 'solid' | 'outline'
  /** Figma `Size`. Hoje só `xl` existe nas telas de autenticação. */
  size?: 'xl'
  /** Figma `State=Disabled`. Visual de desabilitado, mas continua focável (ver nota abaixo). */
  disabled?: boolean
  /** Figma `State=Loading`. */
  loading?: boolean
  /** Figma `HasIcon`. */
  icon?: IconName | false
  /** Chamado ao clicar enquanto `disabled`: use para mostrar o que falta no formulário. */
  onDisabledClick?: (event: MouseEvent<HTMLButtonElement>) => void
  children: ReactNode
}

/**
 * Botão do DS (`Button`).
 *
 * `disabled` NÃO usa o atributo nativo: usa `aria-disabled`. O visual é o do Figma, mas o botão
 * segue focável e clicável, para o usuário descobrir o que falta (product-ui-patterns: formulários,
 * "prefira manter habilitado e mostrar erro específico"). O envio é bloqueado aqui dentro.
 */
export function Button({
  variant = 'solid',
  size = 'xl',
  disabled = false,
  loading = false,
  icon = 'arrow-up-right-01',
  onClick,
  onDisabledClick,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const inert = disabled || loading

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (inert) {
      event.preventDefault()
      if (disabled && !loading) onDisabledClick?.(event)
      return
    }
    onClick?.(event)
  }

  return (
    <button
      {...rest}
      type={type}
      className={cx(styles.button, className)}
      data-variant={variant}
      data-size={size}
      aria-disabled={inert || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
    >
      <span className={styles.label}>{children}</span>
      {(icon || loading) && (
        <span className={styles.slot} data-loading={loading || undefined}>
          <Icon name={loading ? 'loading-03' : (icon as IconName)} spin={loading} className={styles.icon} />
        </span>
      )}
    </button>
  )
}
