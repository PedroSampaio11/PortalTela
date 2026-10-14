import { useRetained } from '@/hooks/useRetained'
import { Reveal } from '../Reveal'
import { InlineMessage } from './InlineMessage'
import type { InlineMessageProps, InlineMessageTone } from './InlineMessage'

interface InlineMessageSlotProps extends Omit<InlineMessageProps, 'children' | 'tone'> {
  /** Texto da mensagem; vazio/falso fecha o espaço com animação (o texto fica até terminar de sair). */
  message: string | null | undefined | false
  tone?: InlineMessageTone
  /** Espaçamento do contêiner pai (padrão: `component/lg`, o gap do formulário). */
  gap?: string
}

/** `InlineMessage` que entra e sai suavemente, sem empurrar o layout de uma vez. */
export function InlineMessageSlot({ message, tone = 'error', gap, ...props }: InlineMessageSlotProps) {
  const text = useRetained(message)
  const retainedTone = useRetained(tone) ?? tone
  return (
    <Reveal open={Boolean(message)} gap={gap}>
      <InlineMessage {...props} tone={retainedTone as InlineMessageTone}>
        {text}
      </InlineMessage>
    </Reveal>
  )
}
