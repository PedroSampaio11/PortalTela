import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import googleLogo from '@/assets/brand/google.svg'
import { Icon } from '../Icon'
import styles from './SocialButton.module.css'

export interface SocialButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Figma `Provider`. O nome é fixo: é marca. */
  provider: 'google' | 'apple'
  /** Figma `State=Loading`: o logo vira o indicador de carregamento. */
  loading?: boolean
}

const NAMES = { google: 'Google', apple: 'Apple' } as const

/** `SocialButton` do DS (3131:26322), Style=Light, Size=xl. */
export function SocialButton({ provider, loading = false, disabled, className, onClick, ...rest }: SocialButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      className={cx(styles.button, className)}
      aria-busy={loading || undefined}
      aria-disabled={disabled || loading || undefined}
      data-loading={loading || undefined}
      onClick={(event) => {
        if (disabled || loading) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      <span className={styles.logo}>
        {loading ? (
          <Icon name="loading-03" spin />
        ) : provider === 'google' ? (
          <img src={googleLogo} alt="" width={24} height={24} />
        ) : (
          <Icon name="apple" width={20.215} height={24} className={styles.apple} />
        )}
      </span>
      <span className={styles.name}>{NAMES[provider]}</span>
      <span className={styles.ring} aria-hidden="true" />
    </button>
  )
}
