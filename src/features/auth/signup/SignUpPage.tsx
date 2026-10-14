import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountPrompt } from '@/components/auth/AccountPrompt'
import { AuthCard } from '@/components/auth/AuthCard'
import { AuthResult } from '@/components/auth/AuthResult'
import { StepIndicator } from '@/components/auth/StepIndicator'
import { getSignUpScenario } from '@/features/demo/scenarios'
import { useDemoScenario } from '@/features/demo/useDemoScenario'
import { newLockEnd, registerAccount } from '../mock/authApi'
import { signupCodeFlow } from '../mock/codeFlow'
import { CodeStep } from '../shared/CodeStep'
import { PasswordStep } from '../shared/PasswordStep'
import { timing } from '../timing'
import { DetailsStep } from './DetailsStep'

/**
 * Fluxo de cadastro, em 3 etapas (Figma `SignUpFlowSection`).
 * details -> emailSent (resultado) -> code -> codeConfirmed (resultado) -> password -> done (resultado).
 */
type Step = 'details' | 'emailSent' | 'code' | 'codeConfirmed' | 'password' | 'done'

const autoAdvanceMs = (step: Step): number | undefined =>
  step === 'emailSent' || step === 'codeConfirmed' ? timing.result : step === 'done' ? timing.redirect : undefined

export function SignUpPage() {
  const navigate = useNavigate()
  const scenario = useDemoScenario('signup', getSignUpScenario)
  const frozen = scenario !== undefined // estado da demonstração: nada avança sozinho

  const [step, setStep] = useState<Step>(scenario?.step ?? 'details')
  const [details, setDetails] = useState(
    scenario && scenario.step !== 'details' ? { name: 'Ana Souza', email: scenario.email } : { name: '', email: '' },
  )
  const [lockedUntil, setLockedUntil] = useState<number | null>(
    scenario?.code?.phase === 'blocked' ? newLockEnd() : null,
  )

  const goHome = useCallback(() => navigate('/', { replace: true }), [navigate])

  useEffect(() => {
    const delay = autoAdvanceMs(step)
    if (delay === undefined || frozen) return
    const id = window.setTimeout(() => {
      if (step === 'emailSent') setStep('code')
      else if (step === 'codeConfirmed') setStep('password')
      else goHome()
    }, delay)
    return () => window.clearTimeout(id)
  }, [step, frozen, goHome])

  const progress =
    step === 'details' ? <StepIndicator total={3} current={1} /> : step === 'code' ? <StepIndicator total={3} current={2} /> : step === 'password' ? <StepIndicator total={3} current={3} /> : undefined

  return (
    <AuthCard
      stepKey={step}
      progress={progress}
      backTo={step === 'details' ? '/entrar' : undefined}
      backLabel={step === 'details' ? 'Voltar para o login' : 'Trocar e-mail'}
      onBack={step === 'code' ? () => setStep('details') : undefined}
    >
      {step === 'details' && (
        <DetailsStep
          defaults={details}
          scenario={scenario?.details}
          onSent={(next, lock) => {
            setDetails(next)
            setLockedUntil(lock)
            setStep('emailSent')
          }}
          onSocialSuccess={goHome}
        />
      )}
      {step === 'emailSent' && <AuthResult title="Código enviado" description="Verifique seu email" />}
      {step === 'code' && (
        <CodeStep
          flow="signup"
          codeFlow={signupCodeFlow}
          scenario={scenario?.code}
          email={details.email}
          initialLockedUntil={lockedUntil}
          onVerified={() => setStep('codeConfirmed')}
          onChangeEmail={() => setStep('details')}
          footer={<AccountPrompt intent="sign-in" to="/entrar" />}
        />
      )}
      {step === 'codeConfirmed' && <AuthResult title="Código confirmado" description="Agora crie sua senha para finalizar seu cadastro." />}
      {step === 'password' && (
        <PasswordStep
          title="Crie sua senha"
          description="Use uma senha que só você conheça."
          passwordLabel="Senha"
          passwordPlaceholder="insira a senha"
          confirmLabel="Confirmar senha"
          confirmPlaceholder="insira a senha novamente"
          scenario={scenario?.password}
          submitLabel="Criar conta"
          loadingLabel="Criando"
          onSubmit={(password) => registerAccount({ name: details.name, email: details.email, password })}
          onDone={() => setStep('done')}
        />
      )}
      {step === 'done' && <AuthResult title="Conta criada" description="Sua conta está pronta. Vamos personalizar o portal para você." />}
    </AuthCard>
  )
}
