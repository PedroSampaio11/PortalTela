import { useState } from 'react'

/**
 * Guarda o último valor "verdadeiro". Serve para o texto de uma mensagem continuar visível enquanto
 * ela anima a saída (o valor real já virou vazio). Só para valores primitivos (comparação por valor).
 */
export function useRetained<T extends string | number>(value: T | null | undefined | false): T | null {
  const [retained, setRetained] = useState<T | null>(value || null)
  if (value && value !== retained) setRetained(value)
  return value || retained
}
