import { readJson, remove, writeJson } from './storage'

/**
 * Backend simulado do fluxo de autenticação. Sem banco, sem rede: só regras determinísticas
 * (para demonstrar cada estado do Figma) com latência realista.
 *
 * Cenários de login:
 *  - ana.souza@email.com + Senha@123 ........ sucesso
 *  - qualquer outra combinação .............. credenciais incorretas; a 3ª errada bloqueia por 15 min
 *  - erro@email.com ......................... falha de rede (qualquer senha)
 *  - Google ................................. sucesso | Apple ................... falha do provedor
 */
export const MOCK_USER = { name: 'Ana Souza', email: 'ana.souza@email.com', password: 'Senha@123' } as const
export const MAX_LOGIN_ATTEMPTS = 3
export const LOCK_DURATION_MS = 15 * 60 * 1000
export const NETWORK_FAILURE_EMAIL = 'erro@email.com'

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'LOCKED' | 'NETWORK' | 'SOCIAL_FAILED'

export class AuthApiError extends Error {
  readonly code: AuthErrorCode
  readonly lockedUntil?: number

  constructor(code: AuthErrorCode, options: { lockedUntil?: number } = {}) {
    super(code)
    this.name = 'AuthApiError'
    this.code = code
    this.lockedUntil = options.lockedUntil
  }
}

export interface Session {
  name: string
  email: string
  provider: 'password' | 'google' | 'apple'
}

const LOGIN_STATE_KEY = 'portaltela.mock.login'
const SESSION_KEY = 'portaltela.session'
const ACCOUNTS_KEY = 'portaltela.mock.accounts'

interface Account {
  name: string
  password: string
}

/** Contas do mock: a de demonstração mais as criadas no cadastro ou alteradas na recuperação. */
function readAccounts(): Record<string, Account> {
  return {
    [MOCK_USER.email]: { name: MOCK_USER.name, password: MOCK_USER.password },
    ...readJson<Record<string, Account>>(ACCOUNTS_KEY, {}),
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export function accountExists(email: string): boolean {
  return normalizeEmail(email) in readAccounts()
}

export function registerAccount(input: { name: string; email: string; password: string }): Session {
  const email = normalizeEmail(input.email)
  writeJson(ACCOUNTS_KEY, { ...readJson<Record<string, Account>>(ACCOUNTS_KEY, {}), [email]: { name: input.name, password: input.password } })
  const session: Session = { name: input.name, email, provider: 'password' }
  writeJson(SESSION_KEY, session)
  return session
}

/** Troca a senha (recuperação). E-mail desconhecido não falha: a resposta nunca revela se a conta existe. */
export function updatePassword(emailInput: string, password: string): Session | null {
  const email = normalizeEmail(emailInput)
  const account = readAccounts()[email]
  if (!account) return null
  writeJson(ACCOUNTS_KEY, { ...readJson<Record<string, Account>>(ACCOUNTS_KEY, {}), [email]: { ...account, password } })
  remove(LOGIN_STATE_KEY)
  const session: Session = { name: account.name, email, provider: 'password' }
  writeJson(SESSION_KEY, session)
  return session
}

interface LoginState {
  attempts: number
  lockedUntil: number | null
}

/** Latência simulada. Em testes (`delay: 0`) resolve na hora. */
export const config = { latency: { min: 800, max: 1400 }, socialLatency: 1600 }

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function jitter(): number {
  const { min, max } = config.latency
  return min + Math.random() * (max - min)
}

function readLoginState(): LoginState {
  const state = readJson<LoginState>(LOGIN_STATE_KEY, { attempts: 0, lockedUntil: null })
  if (state.lockedUntil !== null && state.lockedUntil <= Date.now()) return { attempts: 0, lockedUntil: null }
  return state
}

/** Fim do bloqueio, se existir um ativo. Usado para abrir a tela direto no estado Blocked. */
export function getLoginLock(): number | null {
  return readLoginState().lockedUntil
}

export async function login(input: { email: string; password: string; remember: boolean }): Promise<Session> {
  await wait(jitter())
  const email = normalizeEmail(input.email)
  const state = readLoginState()

  if (state.lockedUntil !== null) throw new AuthApiError('LOCKED', { lockedUntil: state.lockedUntil })
  if (email === NETWORK_FAILURE_EMAIL) throw new AuthApiError('NETWORK')

  const account = readAccounts()[email]
  if (account && input.password === account.password) {
    remove(LOGIN_STATE_KEY)
    const session: Session = { name: account.name, email, provider: 'password' }
    writeJson(SESSION_KEY, session)
    return session
  }

  const attempts = state.attempts + 1
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    // Alinhado ao segundo: a contagem regressiva (que tica a cada 1s) começa exatamente em 15:00.
    const lockedUntil = Math.floor((Date.now() + LOCK_DURATION_MS) / 1000) * 1000
    writeJson(LOGIN_STATE_KEY, { attempts, lockedUntil })
    throw new AuthApiError('LOCKED', { lockedUntil })
  }
  writeJson(LOGIN_STATE_KEY, { attempts, lockedUntil: null })
  throw new AuthApiError('INVALID_CREDENTIALS')
}

export async function loginWithProvider(provider: 'google' | 'apple'): Promise<Session> {
  await wait(config.socialLatency)
  if (provider === 'apple') throw new AuthApiError('SOCIAL_FAILED')
  const session: Session = { name: MOCK_USER.name, email: MOCK_USER.email, provider }
  writeJson(SESSION_KEY, session)
  return session
}

export function getSession(): Session | null {
  return readJson<Session | null>(SESSION_KEY, null)
}

export function logout(): void {
  remove(SESSION_KEY)
}

/** Zera o bloqueio e a sessão (atalho de demonstração). */
export function resetLoginMock(): void {
  remove(LOGIN_STATE_KEY)
  remove(SESSION_KEY)
  remove(ACCOUNTS_KEY)
}

/** Exposto para o cadastro e a recuperação usarem a mesma latência simulada. */
export const simulateLatency = (): Promise<void> => wait(jitter())
export { wait as sleep }
