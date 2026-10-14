/**
 * Registro de TODOS os estados das telas de autenticação (45 do Figma + 4 que o produto real teria), para navegar por eles numa apresentação
 * sem precisar provocá-los (sem esperar bloqueio, sem decorar códigos). Cada estado tem link direto:
 * `/entrar?demo&state=login.blocked`. Os estados abrem congelados (sem avançar sozinhos) para inspeção,
 * mas os campos e botões continuam funcionando.
 */
export type DemoFlow = 'login' | 'recovery' | 'signup'

export interface DemoStateDef {
  id: string
  flow: DemoFlow
  label: string
  route: string
  /** true para estados que não existem no Figma e que o produto real teria. */
  extra?: boolean
}

export const FLOW_LABELS: Record<DemoFlow, string> = {
  login: 'Entrar',
  recovery: 'Recuperar senha',
  signup: 'Criar conta',
}

const ROUTES: Record<DemoFlow, string> = { login: '/entrar', recovery: '/recuperar-senha', signup: '/cadastro' }

const state = (flow: DemoFlow, key: string, label: string, extra = false): DemoStateDef => ({
  id: `${flow}.${key}`,
  flow,
  label,
  route: ROUTES[flow],
  extra: extra || undefined,
})

/** Etapas de código e senha são iguais nos dois fluxos (mudam só os textos), então a lista se repete. */
const codeAndPassword = (flow: 'recovery' | 'signup'): DemoStateDef[] => [
  state(flow, 'code', 'Código: padrão'),
  state(flow, 'code-filled', 'Código: preenchido'),
  state(flow, 'code-verifying', 'Código: verificando'),
  state(flow, 'code-error', 'Código: incorreto'),
  state(flow, 'code-expired', 'Código: expirado'),
  state(flow, 'code-blocked', 'Código: bloqueado'),
  state(flow, 'code-resent', 'Código: reenviado'),
  state(flow, 'code-success', 'Código: confirmado (barra)', true),
  state(flow, 'code-confirmed', 'Código confirmado'),
  state(flow, 'password', 'Senha: padrão'),
  state(flow, 'password-weak', 'Senha: fraca'),
  state(flow, 'password-mismatch', 'Senha: diferentes'),
  state(flow, 'password-valid', 'Senha: válida'),
  state(flow, 'password-loading', 'Senha: salvando'),
]

export const DEMO_STATES: readonly DemoStateDef[] = [
  state('login', 'default', 'Padrão'),
  state('login', 'validation', 'Campos obrigatórios', true),
  state('login', 'filled', 'Preenchido'),
  state('login', 'loading', 'Entrando'),
  state('login', 'error', 'Credenciais incorretas'),
  state('login', 'network', 'Falha de rede', true),
  state('login', 'blocked', 'Bloqueado'),
  state('login', 'social-loading', 'Social: conectando'),
  state('login', 'social-error', 'Social: erro'),

  state('recovery', 'email', 'E-mail: padrão'),
  state('recovery', 'email-error', 'E-mail: formato inválido'),
  state('recovery', 'email-filled', 'E-mail: preenchido'),
  state('recovery', 'email-loading', 'E-mail: enviando'),
  state('recovery', 'email-sent', 'Código enviado'),
  ...codeAndPassword('recovery'),
  state('recovery', 'updated', 'Senha atualizada'),

  state('signup', 'details', 'Dados: padrão'),
  state('signup', 'details-error', 'Dados: erros'),
  state('signup', 'details-filled', 'Dados: preenchido'),
  state('signup', 'details-loading', 'Dados: enviando'),
  state('signup', 'email-sent', 'Código enviado'),
  ...codeAndPassword('signup'),
  state('signup', 'done', 'Conta criada'),
]

export function demoHref(id: string): string {
  const def = DEMO_STATES.find((item) => item.id === id)
  return `${def?.route ?? '/entrar'}?demo&state=${id}`
}

// ---------------------------------------------------------------------------------------------
// Cenários: o que cada estado pede de cada tela. Valores iguais aos usados nos frames do Figma.
// ---------------------------------------------------------------------------------------------
export const DEMO_EMAIL = 'test@gmail.com'
export const DEMO_PASSWORD = 'test@2026'

export interface LoginScenario {
  email?: string
  password?: string
  /** "Manter-me conectado" marcado (obrigatório para entrar; os estados pós-envio já vêm marcados). */
  remember?: boolean
  phase?: 'submitting' | 'error' | 'blocked' | 'socialLoading' | 'socialError'
  errorKind?: 'credentials' | 'network'
  provider?: 'google' | 'apple'
  /** Mostra os erros de campo (envio vazio). */
  validate?: boolean
}

export interface EmailScenario {
  email?: string
  validate?: boolean
  submitting?: boolean
}

export interface DetailsScenario {
  name?: string
  email?: string
  terms?: boolean
  validate?: boolean
  submitting?: boolean
}

export interface CodeScenario {
  value?: string
  phase?: 'verifying' | 'error' | 'expired' | 'blocked' | 'success'
  attemptsLeft?: number
  sent?: boolean
}

export interface PasswordScenario {
  password?: string
  confirm?: string
  confirmTouched?: boolean
  submitting?: boolean
}

export interface FlowScenario<Step extends string> {
  step: Step
  /** E-mail da conta nas etapas seguintes (código e senha). */
  email: string
  emailStep?: EmailScenario
  details?: DetailsScenario
  code?: CodeScenario
  password?: PasswordScenario
}

export type RecoveryStep = 'email' | 'emailSent' | 'code' | 'codeConfirmed' | 'password' | 'updated'
export type SignUpStep = 'details' | 'emailSent' | 'code' | 'codeConfirmed' | 'password' | 'done'

const STRONG = 'Abcdef1!'

const CODE: Record<string, CodeScenario> = {
  code: {},
  'code-filled': { value: '123456' },
  'code-verifying': { value: '123456', phase: 'verifying' },
  'code-error': { value: '111111', phase: 'error', attemptsLeft: 2 },
  'code-expired': { value: '000000', phase: 'expired' },
  'code-blocked': { phase: 'blocked' },
  'code-resent': { sent: true },
  'code-success': { value: '123456', phase: 'success' },
}

const PASSWORD: Record<string, PasswordScenario> = {
  password: {},
  'password-weak': { password: 'ABCDEFGH' },
  'password-mismatch': { password: STRONG, confirm: 'Abcdef1?', confirmTouched: true },
  'password-valid': { password: STRONG, confirm: STRONG },
  'password-loading': { password: STRONG, confirm: STRONG, submitting: true },
}

export function getLoginScenario(key: string): LoginScenario | undefined {
  const full = { email: DEMO_EMAIL, password: 'senha-errada', remember: true }
  switch (key) {
    case 'default':
      return {}
    case 'validation':
      return { validate: true }
    case 'filled':
      return { email: DEMO_EMAIL, password: DEMO_PASSWORD, remember: true }
    case 'loading':
      return { email: DEMO_EMAIL, password: DEMO_PASSWORD, remember: true, phase: 'submitting' }
    case 'error':
      return { ...full, phase: 'error', errorKind: 'credentials' }
    case 'network':
      return { ...full, phase: 'error', errorKind: 'network' }
    case 'blocked':
      return { ...full, phase: 'blocked' }
    case 'social-loading':
      return { phase: 'socialLoading', provider: 'google' }
    case 'social-error':
      return { phase: 'socialError' }
    default:
      return undefined
  }
}

export function getRecoveryScenario(key: string): FlowScenario<RecoveryStep> | undefined {
  const base = { email: DEMO_EMAIL }
  switch (key) {
    case 'email':
      return { ...base, step: 'email' }
    case 'email-error':
      return { ...base, step: 'email', emailStep: { email: 'ana.souza@', validate: true } }
    case 'email-filled':
      return { ...base, step: 'email', emailStep: { email: DEMO_EMAIL } }
    case 'email-loading':
      return { ...base, step: 'email', emailStep: { email: DEMO_EMAIL, submitting: true } }
    case 'email-sent':
      return { ...base, step: 'emailSent' }
    case 'code-confirmed':
      return { ...base, step: 'codeConfirmed' }
    case 'updated':
      return { ...base, step: 'updated' }
    default:
      if (key in CODE) return { ...base, step: 'code', code: CODE[key] }
      if (key in PASSWORD) return { ...base, step: 'password', password: PASSWORD[key] }
      return undefined
  }
}

export function getSignUpScenario(key: string): FlowScenario<SignUpStep> | undefined {
  const base = { email: DEMO_EMAIL }
  switch (key) {
    case 'details':
      return { ...base, step: 'details' }
    case 'details-error':
      return { ...base, step: 'details', details: { validate: true } }
    case 'details-filled':
      return { ...base, step: 'details', details: { name: 'Ana Souza', email: DEMO_EMAIL, terms: true } }
    case 'details-loading':
      return { ...base, step: 'details', details: { name: 'Ana Souza', email: DEMO_EMAIL, terms: true, submitting: true } }
    case 'email-sent':
      return { ...base, step: 'emailSent' }
    case 'code-confirmed':
      return { ...base, step: 'codeConfirmed' }
    case 'done':
      return { ...base, step: 'done' }
    default:
      if (key in CODE) return { ...base, step: 'code', code: CODE[key] }
      if (key in PASSWORD) return { ...base, step: 'password', password: PASSWORD[key] }
      return undefined
  }
}
