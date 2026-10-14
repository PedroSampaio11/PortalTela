import { useSearchParams } from 'react-router-dom'
import { isDemoEnabled } from './demoMode'
import type { DemoFlow } from './scenarios'

/** Id do estado pedido na URL (`?demo&state=login.blocked`), só com o modo demonstração ligado. */
export function useDemoStateId(): string | null {
  const [params] = useSearchParams()
  const id = params.get('state')
  return id && isDemoEnabled() ? id : null
}

/** Cenário do estado atual para um fluxo (ou `undefined` no uso normal). */
export function useDemoScenario<T>(flow: DemoFlow, resolve: (key: string) => T | undefined): T | undefined {
  const id = useDemoStateId()
  if (!id?.startsWith(`${flow}.`)) return undefined
  return resolve(id.slice(flow.length + 1))
}
