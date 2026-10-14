import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthResult } from '@/components/auth/AuthResult'
import { StepIndicator } from '@/components/auth/StepIndicator'
import { recoveryIllustration } from '../illustrations'
import { timing } from '../timing'
import { recoveryCodeFlow } from '../mock/codeFlow'
import { updatePassword } from '../mock/authApi'
import { CodeStep } from '../shared/CodeStep'
import { PasswordStep } from '../shared/PasswordStep'
import { EmailStep } from './EmailStep'

/**
 * Fluxo de recuperação de senha, em 3 etapas (Figma `RecoveryFlowSection`).
 * email -> emailSent (resultado) -> code -> codeConfirmed (resultado) -> password -> updated (resultado).
 * As telas de resultado seguem sozinhas; o botão voltar existe só onde a etapa anterior ainda é segura.
 */
type Step = 'email' | 'emailSent' | 'code' | 'codeConfirmed' | 'password' | 'updated'

const autoAdvanceMs = (step: Step): number | undefined =>
  step === 'emailSent' || step === 'codeConfirmed' ? timing.result : step === 'updated' ? timing.redirect : undefined

export function RecoveryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as { email?: string } | null)?.email ?? ''

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState(prefill)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  const goTo = useCallback((next: Step) => setStep(next), [])

  useEffect(() => {
    const delay = autoAdvanceMs(step)
    if (delay === undefined) return
    const id = window.setTimeout(() => {
      if (step === 'emailSent') goTo('code')
      else if (step === 'codeConfirmed') goTo('password')
      else navigate('/', { replace: true })
    }, delay)
    return () => window.clearTimeout(id)
  }, [step, goTo, navigate])

  const progress =
    step === 'email' ? <StepIndicator total={3} current={1} /> : step === 'code' ? <StepIndicator total={3} current={2} /> : step === 'password' ? <StepIndicator total={3} current={3} /> : undefined

  return (
    <AuthLayout
      illustration={recoveryIllustration}
      progress={progress}
      backTo={step === 'email' ? '/entrar' : undefined}
      backLabel={step === 'email' ? 'Voltar para o login' : 'Trocar e-mail'}
      onBack={step === 'code' ? () => goTo('email') : undefined}
    >
      {step === 'email' && (
        <EmailStep
          defaultEmail={email}
          onSent={(sentTo, lock) => {
            setEmail(sentTo)
            setLockedUntil(lock)
            goTo('emailSent')
          }}
        />
      )}
      {step === 'emailSent' && <AuthResult title="Código enviado" description="Verifique seu email" />}
      {step === 'code' && (
        <CodeStep
          flow="recovery"
          codeFlow={recoveryCodeFlow}
          email={email}
          initialLockedUntil={lockedUntil}
          onVerified={() => goTo('codeConfirmed')}
          onChangeEmail={() => goTo('email')}
        />
      )}
      {step === 'codeConfirmed' && (
        <AuthResult title="Código confirmado" description="Agora crie uma nova senha para voltar a acessar sua conta." />
      )}
      {step === 'password' && (
        <PasswordStep
          title="Crie uma nova senha"
          description="Defina uma nova senha para voltar a acessar sua conta."
          passwordLabel="Nova senha"
          passwordPlaceholder="mínimo de 8 caracteres"
          confirmLabel="Confirmar nova senha"
          confirmPlaceholder="repita a senha"
          submitLabel="Atualizar senha"
          onSubmit={(password) => updatePassword(email, password)}
          onDone={() => goTo('updated')}
        />
      )}
      {step === 'updated' && (
        <AuthResult title="Senha atualizada" description="Você já pode usar a nova senha. Vamos levar você ao portal." />
      )}
    </AuthLayout>
  )
}
