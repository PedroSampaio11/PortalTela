import type { Ref } from 'react'

/** Atribui um nó a uma ref (callback ou objeto). Para juntar a ref de fora com uma ref interna. */
export function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === 'function') ref(node)
  else if (ref) (ref as { current: T | null }).current = node
}
