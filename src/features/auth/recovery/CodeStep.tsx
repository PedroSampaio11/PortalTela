import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { ResendCode } from '@/components/auth/ResendCode'
import type { ResendState } from '@/components/auth/ResendCode'
import { Button, InlineMessage } from '@/components/ui'
import { CodeSlots } from '@/components/ui/CodeSlots'
import { useCountdown } from '@/hooks/useCountdown'
import { maskEmail } from '../email'
import { timing } from '../timing'
import { CODE_RULES, CodeFlowError, recoveryCodeFlow, resendCooldown } from '../mock/codeFlow'
import styles from './RecoveryPage.module.css'

type Phase = 'idle' | 'verifying' | 'error' | 'expired' | 'blocked' | 'success'

interface CodeStepProps {
  email: string
  initialLockedUntil: number | null
  onVerified: () => void
  /** "Trocar e-mail": volta à etapa 1 com o valor preservado. */
  onChangeEmail: () => void
}

/** Etapa 2 de 3 (Figma `VerifyCodeForm` Flow=Recovery). */
export function CodeStep({ email, initialLockedUntil, onVerified, onChangeEmail }: CodeStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [phase, setPhase] = useState<Phase>(initialLockedUntil ? 'blocked' : 'idle')
  const [lockedUntil, setLockedUntil] = useState<number | null>(initialLockedUntil)
  const [attemptsLeft, setAttemptsLeft] = useState<number>(CODE_RULES.maxAttempts)
  const [shakeKey, setShakeKey] = useState(0)
  const [showSent, setShowSent] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldownKey, setCooldownKey] = useState(0)
  const [exhausted, setExhausted] = useState(() => recoveryCodeFlow.resendsLeft() === 0)

  const secondsLeft = useCountdown(resendCooldown.seconds, cooldownKey)

  // O bloqueio expira sozinho.
  useEffect(() => {
    if (phase !== 'blocked' || lockedUntil === null) return
    const id = window.setTimeout(() => {
      setPhase('idle')
      setLockedUntil(null)
      setAttemptsLeft(CODE_RULES.maxAttempts)
    }, Math.max(0, lockedUntil - Date.now()))
    return () => window.clearTimeout(id)
  }, [phase, lockedUntil])

  // "Código reenviado" some depois de um tempo e a contagem recomeça.
  useEffect(() => {
    if (!showSent) return
    const id = window.setTimeout(() => {
      setShowSent(false)
      setCooldownKey((key) => key + 1)
    }, 4000)
    return () => window.clearTimeout(id)
  }, [showSent])

  // Sucesso: a barra com o check aparece e, em seguida, vem a tela "Código confirmado".
  useEffect(() => {
    if (phase !== 'success') return
    const id = window.setTimeout(onVerified, timing.successBar)
    return () => window.clearTimeout(id)
  }, [phase, onVerified])

  const blocked = phase === 'blocked'
  const expired = phase === 'expired'
  const busy = phase === 'verifying' || phase === 'success'
  const complete = value.length === CODE_RULES.length

  // Sent: confirmação; Counting: espera de 30s; Ready: link ativo (também logo após expirar); Limit: acabaram os reenvios.
  let resendState: ResendState
  if (blocked) resendState = 'limit'
  else if (showSent) resendState = 'sent'
  else if (secondsLeft > 0 && !expired) resendState = 'counting'
  else resendState = exhausted ? 'limit' : 'ready'

  async function verify() {
    setPhase('verifying')
    try {
      await recoveryCodeFlow.verify(value)
      setPhase('success')
    } catch (error) {
      if (!(error instanceof CodeFlowError)) throw error
      if (error.code === 'LOCKED') {
        setLockedUntil(error.lockedUntil ?? null)
        setPhase('blocked')
        setValue('')
      } else if (error.code === 'EXPIRED') {
        setPhase('expired')
      } else {
        setAttemptsLeft(error.attemptsLeft ?? 0)
        setPhase('error')
        setShakeKey((key) => key + 1)
      }
    }
  }

  async function resend() {
    setResending(true)
    try {
      const { resendsLeft } = await recoveryCodeFlow.resend()
      setExhausted(resendsLeft === 0)
      setValue('')
      setPhase('idle')
      setShowSent(true)
      inputRef.current?.focus()
    } catch (error) {
      if (error instanceof CodeFlowError && error.code === 'RESEND_LIMIT') setExhausted(true)
      if (error instanceof CodeFlowError && error.code === 'LOCKED') {
        setLockedUntil(error.lockedUntil ?? null)
        setPhase('blocked')
      }
    } finally {
      setResending(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (complete && !busy && !blocked) void verify()
  }

  const description = blocked
    ? 'Se o e-mail estiver cadastrado, enviamos um código de 6 dígitos. Ele vale por 10 minutos.'
    : `Enviamos um código de 6 dígitos para ${maskEmail(email)}`

  return (
    <>
      <AuthHeader title="Digite o código de verificação" description={description} />
      {phase === 'error' && (
        <InlineMessage hasIcon>
          Código incorreto. Você tem mais {attemptsLeft} {attemptsLeft === 1 ? 'tentativa' : 'tentativas'}.
        </InlineMessage>
      )}
      {expired && (
        <InlineMessage tone="warning" hasIcon>
          Esse código expirou. Peça um novo.
        </InlineMessage>
      )}
      {blocked && (
        <InlineMessage hasIcon>
          Muitas tentativas. Por segurança, novas tentativas foram bloqueadas. Tente de novo mais tarde.
        </InlineMessage>
      )}
      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={busy || undefined}>
        <CodeSlots
          label="Código de verificação de 6 dígitos"
          value={value}
          onChange={(next) => {
            setValue(next)
            // Editar depois de errar: as casas voltam ao normal (a mensagem fica até a próxima tentativa).
            if (phase === 'error') setPhase('idle')
          }}
          status={phase === 'error' ? 'error' : phase === 'success' ? 'success' : 'default'}
          shakeKey={shakeKey}
          disabled={blocked}
          autoFocus={!blocked}
          inputRef={inputRef}
        />
        {phase !== 'success' && (
          <ResendCode
            state={resending ? 'counting' : resendState}
            seconds={secondsLeft}
            onResend={() => void resend()}
            onChangeEmail={onChangeEmail}
          />
        )}
        <Button
          type="submit"
          variant="outline"
          loading={phase === 'verifying'}
          disabled={!complete || blocked || phase === 'success'}
          onDisabledClick={() => inputRef.current?.focus()}
        >
          Verificar código
        </Button>
      </form>
    </>
  )
}
