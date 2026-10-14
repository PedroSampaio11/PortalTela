import {
  AuthApiError,
  LOCK_DURATION_MS,
  MOCK_USER,
  NETWORK_FAILURE_EMAIL,
  config,
  getLoginLock,
  getSession,
  login,
  loginWithProvider,
  logout,
  resetLoginMock,
} from './authApi'

const ok = { email: MOCK_USER.email, password: MOCK_USER.password, remember: false }
const wrong = { email: MOCK_USER.email, password: 'errada', remember: false }

async function code(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
    return 'OK'
  } catch (error) {
    return error instanceof AuthApiError ? error.code : 'UNKNOWN'
  }
}

describe('authApi (mock)', () => {
  beforeEach(() => {
    config.latency = { min: 0, max: 0 }
    config.socialLatency = 0
    resetLoginMock()
  })

  it('entra com as credenciais corretas (e-mail sem diferenciar maiúsculas) e cria a sessão', async () => {
    const session = await login({ ...ok, email: '  TEST@Gmail.com ' })
    expect(session).toMatchObject({ name: 'Teste', provider: 'password' })
    expect(getSession()?.email).toBe(MOCK_USER.email)
    logout()
    expect(getSession()).toBeNull()
  })

  it('rejeita credenciais erradas sem revelar qual campo errou', async () => {
    expect(await code(login(wrong))).toBe('INVALID_CREDENTIALS')
    expect(await code(login({ email: 'outra@pessoa.com', password: 'qualquer', remember: false }))).toBe(
      'INVALID_CREDENTIALS',
    )
  })

  it('bloqueia na 3ª tentativa errada por 15 minutos e mantém o bloqueio mesmo com a senha certa', async () => {
    expect(await code(login(wrong))).toBe('INVALID_CREDENTIALS')
    expect(await code(login(wrong))).toBe('INVALID_CREDENTIALS')
    expect(getLoginLock()).toBeNull()
    expect(await code(login(wrong))).toBe('LOCKED')
    const lock = getLoginLock()
    expect(lock).not.toBeNull()
    expect(lock! - Date.now()).toBeLessThanOrEqual(LOCK_DURATION_MS)
    expect(lock! - Date.now()).toBeGreaterThan(LOCK_DURATION_MS - 2000)
    expect(await code(login(ok))).toBe('LOCKED')
  })

  it('o bloqueio expira', async () => {
    for (let i = 0; i < 3; i++) await code(login(wrong))
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + LOCK_DURATION_MS + 1000)
    expect(getLoginLock()).toBeNull()
    expect(await code(login(ok))).toBe('OK')
    vi.useRealTimers()
  })

  it('login correto zera as tentativas erradas', async () => {
    await code(login(wrong))
    await code(login(wrong))
    expect(await code(login(ok))).toBe('OK')
    expect(await code(login(wrong))).toBe('INVALID_CREDENTIALS')
  })

  it('simula falha de rede por e-mail dedicado', async () => {
    expect(await code(login({ email: NETWORK_FAILURE_EMAIL, password: 'x', remember: false }))).toBe('NETWORK')
  })

  it('Google entra e Apple falha (cenários determinísticos)', async () => {
    expect((await loginWithProvider('google')).provider).toBe('google')
    expect(await code(loginWithProvider('apple'))).toBe('SOCIAL_FAILED')
  })
})
