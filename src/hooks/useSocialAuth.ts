import { useCallback, useEffect, useRef, useState } from 'react'
import type { SocialProvider } from '@/components/auth/SocialLogin'
import { loginWithProvider } from '@/features/auth/mock/authApi'

/** Entrar/cadastrar com Google ou Apple: estados Loading (um provedor por vez) e Error do `SocialLogin`. */
export function useSocialAuth(onSuccess: () => void) {
  const [provider, setProvider] = useState<SocialProvider | null>(null)
  const [failed, setFailed] = useState(false)
  const mounted = useRef(true)
  const busy = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const signIn = useCallback(
    async (next: SocialProvider) => {
      if (busy.current) return
      busy.current = true
      setProvider(next)
      setFailed(false)
      try {
        await loginWithProvider(next)
        if (mounted.current) onSuccess()
      } catch {
        if (mounted.current) {
          setFailed(true)
          setProvider(null)
        }
      } finally {
        busy.current = false
      }
    },
    [onSuccess],
  )

  return { loadingProvider: provider, failed, signIn }
}
