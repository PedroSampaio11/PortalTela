import { config, simulateLatency } from './authApi'
import { readJson, remove, writeJson } from './storage'

/**
 * Código de verificação por e-mail (recuperação e cadastro usam as mesmas regras, estados separados).
 *
 *  - 123456 ........... código correto
 *  - 000000 ........... código expirado (10 min), para demonstrar o estado
 *  - qualquer outro ... incorreto; a 3ª tentativa errada bloqueia por 15 min
 *  - reenvio: 30 s de espera entre pedidos e no máximo 3 reenvios
 */
export const CODE_RULES = {
  validCode: '123456',
  expiredCode: '000000',
  length: 6,
  maxAttempts: 3,
  maxResends: 3,
  ttlMs: 10 * 60 * 1000,
  lockMs: 15 * 60 * 1000,
} as const

export type CodeErrorCode = 'INVALID' | 'EXPIRED' | 'LOCKED' | 'RESEND_LIMIT'

export class CodeFlowError extends Error {
  readonly code: CodeErrorCode
  readonly attemptsLeft?: number
  readonly lockedUntil?: number

  constructor(code: CodeErrorCode, extra: { attemptsLeft?: number; lockedUntil?: number } = {}) {
    super(code)
    this.name = 'CodeFlowError'
    this.code = code
    this.attemptsLeft = extra.attemptsLeft
    this.lockedUntil = extra.lockedUntil
  }
}

interface CodeState {
  attempts: number
  resends: number
  lockedUntil: number | null
  sentAt: number | null
}

const EMPTY: CodeState = { attempts: 0, resends: 0, lockedUntil: null, sentAt: null }

export function createCodeFlow(flow: string) {
  const key = `portaltela.mock.code.${flow}`

  function read(): CodeState {
    const state = { ...EMPTY, ...readJson<Partial<CodeState>>(key, {}) }
    if (state.lockedUntil !== null && state.lockedUntil <= Date.now()) return { ...EMPTY }
    return state
  }

  return {
    /** Bloqueio em andamento (fim em ms) ou null. */
    getLock(): number | null {
      return read().lockedUntil
    },

    /** Pede o primeiro código. Nunca falha por e-mail desconhecido (não revela se a conta existe). */
    async request(): Promise<{ lockedUntil: number | null }> {
      await simulateLatency()
      const state = read()
      if (state.lockedUntil !== null) return { lockedUntil: state.lockedUntil }
      writeJson(key, { ...state, sentAt: Date.now(), attempts: 0, resends: 0 })
      return { lockedUntil: null }
    },

    /** Reenvia: respeita o limite de reenvios. Devolve quantos ainda restam. */
    async resend(): Promise<{ resendsLeft: number }> {
      await simulateLatency()
      const state = read()
      if (state.lockedUntil !== null) throw new CodeFlowError('LOCKED', { lockedUntil: state.lockedUntil })
      if (state.resends >= CODE_RULES.maxResends) throw new CodeFlowError('RESEND_LIMIT')
      const resends = state.resends + 1
      writeJson(key, { ...state, resends, sentAt: Date.now() })
      return { resendsLeft: CODE_RULES.maxResends - resends }
    },

    resendsLeft(): number {
      return Math.max(0, CODE_RULES.maxResends - read().resends)
    },

    async verify(code: string): Promise<void> {
      await simulateLatency()
      const state = read()
      if (state.lockedUntil !== null) throw new CodeFlowError('LOCKED', { lockedUntil: state.lockedUntil })

      const expired = code === CODE_RULES.expiredCode || (state.sentAt !== null && Date.now() - state.sentAt > CODE_RULES.ttlMs)
      if (expired) throw new CodeFlowError('EXPIRED')

      if (code === CODE_RULES.validCode) {
        remove(key)
        return
      }
      const attempts = state.attempts + 1
      if (attempts >= CODE_RULES.maxAttempts) {
        // Alinhado ao segundo, como no bloqueio do login.
        const lockedUntil = Math.floor((Date.now() + CODE_RULES.lockMs) / 1000) * 1000
        writeJson(key, { ...state, attempts, lockedUntil })
        throw new CodeFlowError('LOCKED', { lockedUntil })
      }
      writeJson(key, { ...state, attempts })
      throw new CodeFlowError('INVALID', { attemptsLeft: CODE_RULES.maxAttempts - attempts })
    },

    reset(): void {
      remove(key)
    },
  }
}

export const recoveryCodeFlow = createCodeFlow('recovery')
export const signupCodeFlow = createCodeFlow('signup')

/** Cooldown entre reenvios (segundos). Configurável para testes e demonstração. */
export const resendCooldown = { seconds: 30 }
export { config }
