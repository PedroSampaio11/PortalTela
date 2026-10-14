import { DEMO_STATES, demoHref, getLoginScenario, getRecoveryScenario, getSignUpScenario } from './scenarios'

const resolvers = { login: getLoginScenario, recovery: getRecoveryScenario, signup: getSignUpScenario }

describe('registro de estados da demonstração', () => {
  it('cobre os 3 fluxos: 45 estados do Figma (7 + 19 + 19) mais 4 extras do produto real', () => {
    expect(DEMO_STATES.filter((s) => !s.extra)).toHaveLength(45)
    expect(DEMO_STATES.filter((s) => s.extra)).toHaveLength(4)
    expect(DEMO_STATES.filter((s) => s.flow === 'login')).toHaveLength(9)
    expect(DEMO_STATES.filter((s) => s.flow === 'recovery')).toHaveLength(20)
    expect(DEMO_STATES.filter((s) => s.flow === 'signup')).toHaveLength(20)
  })

  it('ids únicos, prefixados pelo fluxo e com rota do fluxo', () => {
    const ids = DEMO_STATES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of DEMO_STATES) {
      expect(s.id.startsWith(`${s.flow}.`)).toBe(true)
      expect(s.route).toBe({ login: '/entrar', recovery: '/recuperar-senha', signup: '/cadastro' }[s.flow])
    }
  })

  it('TODO estado da lista resolve para um cenário (nenhum botão do guia cai no vazio)', () => {
    for (const s of DEMO_STATES) {
      const key = s.id.slice(s.flow.length + 1)
      expect(resolvers[s.flow](key), s.id).toBeDefined()
    }
  })

  it('chave desconhecida não vira cenário', () => {
    expect(getLoginScenario('nao-existe')).toBeUndefined()
    expect(getRecoveryScenario('nao-existe')).toBeUndefined()
    expect(getSignUpScenario('nao-existe')).toBeUndefined()
  })

  it('link direto aponta para a rota certa com ?demo', () => {
    expect(demoHref('login.blocked')).toBe('/entrar?demo&state=login.blocked')
    expect(demoHref('signup.code-expired')).toBe('/cadastro?demo&state=signup.code-expired')
    expect(demoHref('recovery.updated')).toBe('/recuperar-senha?demo&state=recovery.updated')
  })

  it('estados de senha seguem as regras reais (fraca, diferentes e válida)', () => {
    expect(getRecoveryScenario('password-weak')?.password?.password).toBe('ABCDEFGH')
    const mismatch = getRecoveryScenario('password-mismatch')?.password
    expect(mismatch?.password).not.toBe(mismatch?.confirm)
    const valid = getSignUpScenario('password-valid')?.password
    expect(valid?.password).toBe(valid?.confirm)
  })
})
