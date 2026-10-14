import { config, resetLoginMock } from '@/features/auth/mock/authApi'
import { recoveryCodeFlow, resendCooldown, signupCodeFlow } from '@/features/auth/mock/codeFlow'

const DEMO_KEY = 'portaltela.demo'
const FAST_KEY = 'portaltela.demo.fast'

const NORMAL = { latency: { min: 800, max: 1400 }, socialLatency: 1600, cooldown: 30, lockMs: 15 * 60 * 1000 }
const FAST = { latency: { min: 150, max: 300 }, socialLatency: 500, cooldown: 3, lockMs: 20 * 1000 }

function read(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function write(key: string, value: boolean) {
  try {
    if (value) window.sessionStorage.setItem(key, '1')
    else window.sessionStorage.removeItem(key)
  } catch {
    /* sem storage: o modo vale só até recarregar */
  }
}

/** O guia só existe com `?demo` na URL (e continua ligado na sessão). A interface padrão fica limpa. */
export function isDemoEnabled(): boolean {
  if (new URLSearchParams(window.location.search).has('demo')) write(DEMO_KEY, true)
  return read(DEMO_KEY)
}

export function isFastMode(): boolean {
  return read(FAST_KEY)
}

/** Modo rápido: respostas em ~0,2 s, social em 0,5 s, reenvio em 3 s e bloqueio de 20 s (nunca prende a demonstração). */
export function setFastMode(on: boolean): void {
  write(FAST_KEY, on)
  const preset = on ? FAST : NORMAL
  config.latency = { ...preset.latency }
  config.socialLatency = preset.socialLatency
  config.lockMs = preset.lockMs
  resendCooldown.seconds = preset.cooldown
}

/** Reaplica o modo rápido guardado na sessão (chamado na inicialização). */
export function applyStoredDemoSettings(): void {
  if (isDemoEnabled() && isFastMode()) setFastMode(true)
}

/** Zera bloqueios, contas criadas e sessão de todos os fluxos. */
export function resetDemo(): void {
  resetLoginMock()
  recoveryCodeFlow.reset()
  signupCodeFlow.reset()
}
