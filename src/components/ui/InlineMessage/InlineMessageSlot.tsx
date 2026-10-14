import { useRetained } from '@/hooks/useRetained'
import { Reveal } from '../Reveal'
import { InlineMessage } from './InlineMessage'
import type { InlineMessageProps, InlineMessageTone } from './InlineMessage'
import styles from './InlineMessage.module.css'

interface InlineMessageSlotProps extends Omit<InlineMessageProps, 'children' | 'tone'> {
  /** Texto da mensagem; vazio/falso fecha o espaço com animação (o texto fica até terminar de sair). */
  message: string | null | undefined | false
  tone?: InlineMessageTone
  /** Espaçamento do contêiner pai (padrão: `component/lg`, o gap do formulário). */
  gap?: string
  /** Reserva o espaço da mensagem (uma linha) mesmo vazia: ela entra com fade e NADA na tela muda de tamanho. */
  reserve?: boolean
  /** Linhas reservadas no modo `reserve` (padrão 1; mensagens longas usam 2). */
  lines?: number
}

/** `InlineMessage` que entra e sai suavemente, sem empurrar o layout de uma vez. */
export function InlineMessageSlot({ message, tone = 'error', gap, reserve = false, lines = 1, ...props }: InlineMessageSlotProps) {
  const text = useRetained(message)
  const retainedTone = useRetained(tone) ?? tone
  if (reserve) {
    return (
      <div className={styles.reserved} style={{ '--lines': lines } as React.CSSProperties}>
        {message && (
          <InlineMessage {...props} tone={tone} className={styles.enter}>
            {message}
          </InlineMessage>
        )}
      </div>
    )
  }
  return (
    <Reveal open={Boolean(message)} gap={gap}>
      <InlineMessage {...props} tone={retainedTone as InlineMessageTone}>
        {text}
      </InlineMessage>
    </Reveal>
  )
}
