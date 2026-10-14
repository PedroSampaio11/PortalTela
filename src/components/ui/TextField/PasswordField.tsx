import { useState } from 'react'
import { Icon } from '../Icon'
import { TextField } from './TextField'
import type { TextFieldProps } from './TextField'
import styles from './PasswordField.module.css'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>

/** `Text Input` com ação de mostrar/ocultar senha (ícones `view` e `view-off-slash` do DS). */
export function PasswordField({ disabled, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...rest}
      disabled={disabled}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={visible}
          aria-label="Mostrar senha"
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
        >
          <Icon name={visible ? 'view-off-slash' : 'view'} />
        </button>
      }
    />
  )
}
