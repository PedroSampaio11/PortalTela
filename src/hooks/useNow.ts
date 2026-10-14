import { useMemo, useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * Relógio que atualiza a cada `intervalMs` enquanto `active` (contagens regressivas).
 * Usa um store externo (o relógio do sistema): nenhum setState dentro de efeito.
 */
export function useNow(active: boolean, intervalMs = 1000): number {
  const subscribe = useMemo(
    () =>
      active
        ? (onChange: () => void) => {
            const id = window.setInterval(onChange, intervalMs)
            return () => window.clearInterval(id)
          }
        : noopSubscribe,
    [active, intervalMs],
  )
  return useSyncExternalStore(subscribe, () => Math.floor(Date.now() / intervalMs) * intervalMs)
}
