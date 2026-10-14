import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '@/lib/cx'
import styles from './TextField.module.css'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  ref?: Ref<HTMLInputElement>
  /** Figma `Label`. Sempre visível, acima do campo (nunca substituído por placeholder). */
  label: string
  /** Figma `HelperText`. Em `error`/`success` assume a cor do estado. O espaço dele é sempre reservado: o texto
   *  aparece e some com um fade, sem empurrar nem redimensionar a tela. */
  helperText?: string
  /** `warning` pinta só o texto de aviso (ex.: Caps Lock), sem mudar o anel do campo. */
  helperTone?: 'warning'
  /** Figma `State` de validação (Error, Success). Default/Hover/Focus/Filled/Disabled vêm do CSS. */
  status?: 'default' | 'error' | 'success'
  /** Figma `HasTrailingIcon`: ação ao fim do campo (ex.: mostrar senha). */
  trailing?: ReactNode
}

/** `Text Input` do DS (2935:63060), Size=xl. */
export function TextField({
  ref,
  label,
  helperText,
  helperTone,
  status = 'default',
  trailing,
  id,
  className,
  disabled,
  'aria-describedby': describedBy,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const helperId = helperText ? `${inputId}-helper` : undefined

  return (
    <div className={cx(styles.root, className)} data-status={status} data-helper-tone={helperTone} data-disabled={disabled || undefined}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.field}>
        <input
          {...rest}
          ref={ref}
          id={inputId}
          className={styles.input}
          disabled={disabled}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={cx(helperId, describedBy) || undefined}
        />
        {trailing}
        <span className={styles.ring} aria-hidden="true" />
      </div>
      <p id={`${inputId}-helper`} className={styles.helper} aria-live="polite">
        {helperText && (
          <span key={helperText} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </p>
    </div>
  )
}
