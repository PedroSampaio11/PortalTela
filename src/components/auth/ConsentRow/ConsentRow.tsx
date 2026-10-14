import { useId } from 'react'
import type { Ref } from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { TextLink } from '@/components/ui/TextLink'
import styles from './ConsentRow.module.css'

interface ConsentRowProps {
  ref?: Ref<HTMLInputElement>
  name?: string
  checked?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  /** Figma `State=Error` + `ErrorMessage`: a mensagem é texto, não só cor. */
  errorMessage?: string
}

/**
 * `ConsentRow` do DS (3131:26304): checkbox com "Li e aceito os termos de uso e a política de privacidade".
 * Os links abrem em outra aba para não perder o que foi preenchido; clicar neles não marca a caixa.
 */
export function ConsentRow({ ref, errorMessage, ...rest }: ConsentRowProps) {
  const errorId = useId()
  return (
    <div className={styles.root}>
      <Checkbox
        {...rest}
        ref={ref}
        variant="consent"
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        label={
          <span className={styles.text}>
            Li e aceito os{' '}
            <TextLink to="/termos" target="_blank" rel="noopener noreferrer">
              termos de uso
            </TextLink>{' '}
            e a{' '}
            <TextLink to="/privacidade" target="_blank" rel="noopener noreferrer">
              política de privacidade
            </TextLink>
          </span>
        }
      />
      {errorMessage && (
        <p id={errorId} className={styles.error}>
          {errorMessage}
        </p>
      )}
    </div>
  )
}
