import { Divider } from '@/components/ui/Divider'
import { InlineMessageSlot } from '@/components/ui/InlineMessage'
import { SocialButton } from '@/components/ui/SocialButton'
import styles from './SocialLogin.module.css'

export type SocialProvider = 'google' | 'apple'

interface SocialLoginProps {
  /** Figma `State=Loading`: o provedor escolhido está respondendo. */
  loadingProvider?: SocialProvider | null
  /** Figma `State=Error`: mensagem de falha abaixo dos botões. */
  error?: string
  /** Bloqueia os botões sem mudar o visual (ex.: enquanto o e-mail e senha estão sendo enviados). */
  disabled?: boolean
  onProvider: (provider: SocialProvider) => void
}

/**
 * `SocialLogin` do DS (3131:26977): divisor "ou continue com", Google e Apple lado a lado.
 * No estado Loading do Figma os DOIS botões mostram o indicador; aqui também (um provedor por vez).
 */
export function SocialLogin({ loadingProvider = null, error, disabled, onProvider }: SocialLoginProps) {
  const busy = loadingProvider !== null
  return (
    <div className={styles.root}>
      <div className={styles.dividerRow}>
        <Divider />
        <span className={styles.dividerText}>ou continue com</span>
        <Divider />
      </div>
      <div className={styles.providers}>
        <SocialButton
          provider="google"
          loading={busy}
          disabled={disabled}
          onClick={() => onProvider('google')}
          aria-label={busy ? 'Conectando com o Google' : 'Continuar com o Google'}
        />
        <SocialButton
          provider="apple"
          loading={busy}
          disabled={disabled}
          onClick={() => onProvider('apple')}
          aria-label={busy ? 'Conectando com a Apple' : 'Continuar com a Apple'}
        />
      </div>
      <InlineMessageSlot message={error} gap="var(--component-md)" />
    </div>
  )
}
