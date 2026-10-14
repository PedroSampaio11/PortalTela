import { useEffect, useState } from 'react'

/** Contagem regressiva em segundos. Reinicia quando `startKey` muda. Para em 0. */
export function useCountdown(seconds: number, startKey: unknown): number {
  const [state, setState] = useState({ key: startKey, remaining: seconds })
  // Recomeça durante o render quando a chave muda (padrão recomendado: sem setState em efeito).
  if (state.key !== startKey) setState({ key: startKey, remaining: seconds })

  useEffect(() => {
    if (state.remaining <= 0) return
    const id = window.setTimeout(() => setState((s) => ({ ...s, remaining: Math.max(0, s.remaining - 1) })), 1000)
    return () => window.clearTimeout(id)
  }, [state.remaining])

  return state.remaining
}
