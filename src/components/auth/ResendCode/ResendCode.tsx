import { TextLink } from '@/components/ui/TextLink'
import styles from './ResendCode.module.css'

export type ResendState = 'counting' | 'ready' | 'sent' | 'limit'

interface ResendCodeProps {
  /** Figma `State`: Counting (espera), Ready (link ativo), Sent (confirmação), Limit (limite de reenvios). */
  state: ResendState
  /** Segundos restantes (só no Counting). */
  seconds?: number
  onResend: () => void
  /** Figma `HasChangeEmail`: link "Trocar e-mail" (na confirmação de reenvio). */
  onChangeEmail?: () => void
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * `ResendCode` do DS (3019:58828). O contador NÃO é anunciado a cada segundo (descrição do componente):
 * o relógio fica `aria-hidden` e o leitor de tela só ouve quando o reenvio fica disponível.
 */
export function ResendCode({ state, seconds = 0, onResend, onChangeEmail }: ResendCodeProps) {
  return (
    <div className={styles.root}>
      {state === 'counting' && (
        <p className={styles.row}>
          <span className={styles.text}>Não recebeu o código?</span>
          <span className={styles.text}>Reenviar em</span>
          <span className={styles.clock} aria-hidden="true">
            {formatClock(seconds)}
          </span>
        </p>
      )}
      {state === 'ready' && (
        <p className={styles.row}>
          <span className={styles.text}>Não recebeu o código?</span>
          <TextLink onClick={onResend}>Reenviar código</TextLink>
        </p>
      )}
      {state === 'sent' && (
        <>
          <p className={styles.text} role="status">
            Código reenviado. Confira seu e-mail.
          </p>
          {onChangeEmail && <TextLink onClick={onChangeEmail}>Trocar e-mail</TextLink>}
        </>
      )}
      {state === 'limit' && (
        <p className={styles.text} role="status">
          Você atingiu o limite de reenvios. Tente de novo mais tarde.
        </p>
      )}
      {/* Anúncio único quando o reenvio libera. */}
      <span className="visually-hidden" aria-live="polite">
        {state === 'ready' ? 'Você já pode reenviar o código.' : ''}
      </span>
    </div>
  )
}
