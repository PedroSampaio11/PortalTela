import { useCallback, useEffect, useRef, useState } from 'react'
import type { SocialProvider } from '@/components/auth/SocialLogin'
import { AuthApiError, getLoginLock, login, loginWithProvider } from '../mock/authApi'
import type { LoginValues } from '../schemas'

/**
 * Estados do Figma (`LoginForm` State): idle = Default/Filled, submitting = Loading,
 * error = Error, blocked = Blocked, socialLoading = SocialLoading, socialError = SocialError.
 */
export type LoginPhase = 'idle' | 'submitting' | 'error' | 'blocked' | 'socialLoading' | 'socialError'
export type LoginErrorKind = 'credentials' | 'network'

interface LoginState {
  phase: LoginPhase
  errorKind: LoginErrorKind
  lockedUntil: number | null
  provider: SocialProvider | null
}

const IDLE: LoginState = { phase: 'idle', errorKind: 'credentials', lockedUntil: null, provider: null }

function initialState(): LoginState {
  const lockedUntil = getLoginLock()
  return lockedUntil ? { ...IDLE, phase: 'blocked', lockedUntil } : IDLE
}

interface UseLoginOptions {
  onSuccess: () => void
}

export function useLogin({ onSuccess }: UseLoginOptions) {
  const [state, setState] = useState<LoginState>(initialState)
  const mounted = useRef(true)
  const phaseRef = useRef(state.phase)

  useEffect(() => {
    phaseRef.current = state.phase
  }, [state.phase])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // O bloqueio expira sozinho: a tela volta ao estado padrão quando o tempo acaba.
  useEffect(() => {
    if (state.phase !== 'blocked' || state.lockedUntil === null) return
    const id = window.setTimeout(() => setState(IDLE), Math.max(0, state.lockedUntil - Date.now()))
    return () => window.clearTimeout(id)
  }, [state.phase, state.lockedUntil])

  const submit = useCallback(
    async (values: LoginValues) => {
      setState((s) => ({ ...s, phase: 'submitting', provider: null }))
      try {
        await login(values)
        if (mounted.current) onSuccess()
      } catch (error) {
        if (!mounted.current) return
        if (error instanceof AuthApiError && error.code === 'LOCKED') {
          setState({ ...IDLE, phase: 'blocked', lockedUntil: error.lockedUntil ?? null })
        } else if (error instanceof AuthApiError && error.code === 'NETWORK') {
          setState({ ...IDLE, phase: 'error', errorKind: 'network' })
        } else {
          setState({ ...IDLE, phase: 'error' })
        }
      }
    },
    [onSuccess],
  )

  const signInWithProvider = useCallback(
    async (provider: SocialProvider) => {
      // Mesmo visual do Figma (Loading do e-mail e senha não apaga os botões sociais): só bloqueia o clique.
      if (phaseRef.current === 'submitting' || phaseRef.current === 'socialLoading') return
      setState((s) => ({ ...s, phase: 'socialLoading', provider }))
      try {
        await loginWithProvider(provider)
        if (mounted.current) onSuccess()
      } catch {
        if (mounted.current) setState({ ...IDLE, phase: 'socialError' })
      }
    },
    [onSuccess],
  )

  return { ...state, submit, signInWithProvider }
}
