/** Persistência do mock. Tudo em sessionStorage, com fallback em memória (modo privado, SSR, testes). */
const memory = new Map<string, string>()

function store(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = store()?.getItem(key) ?? memory.get(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  const raw = JSON.stringify(value)
  memory.set(key, raw)
  try {
    store()?.setItem(key, raw)
  } catch {
    /* sem storage: fica só em memória */
  }
}

export function remove(key: string): void {
  memory.delete(key)
  try {
    store()?.removeItem(key)
  } catch {
    /* noop */
  }
}
