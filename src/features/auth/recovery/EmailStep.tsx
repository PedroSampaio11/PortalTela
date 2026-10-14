import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { Button, InlineMessage, InlineMessageSlot, TextField } from '@/components/ui'
import type { EmailScenario } from '@/features/demo/scenarios'
import { NETWORK_FAILURE_EMAIL } from '../mock/authApi'
import { recoveryCodeFlow } from '../mock/codeFlow'
import { recoveryEmailSchema } from '../schemas'
import type { RecoveryEmailValues } from '../schemas'
import styles from '../shared/steps.module.css'

interface EmailStepProps {
  defaultEmail: string
  /** Estado forçado pela demonstração. */
  scenario?: EmailScenario
  onSent: (email: string, lockedUntil: number | null) => void
}

/** Etapa 1 de 3 (Figma `ForgotPasswordForm`: Default, Error, Loading). */
export function EmailStep({ defaultEmail, scenario, onSent }: EmailStepProps) {
  const [submitting, setSubmitting] = useState(scenario?.submitting ?? false)
  const [failed, setFailed] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isValid },
  } = useForm<RecoveryEmailValues>({ resolver: zodResolver(recoveryEmailSchema), mode: 'onTouched', defaultValues: { email: scenario?.email ?? defaultEmail } })

  useEffect(() => {
    if (scenario?.validate) void trigger()
  }, [scenario?.validate, trigger])

  const submit = handleSubmit(async ({ email }) => {
    setSubmitting(true)
    setFailed(false)
    try {
      if (email.trim().toLowerCase() === NETWORK_FAILURE_EMAIL) throw new Error('network')
      const { lockedUntil } = await recoveryCodeFlow.request()
      onSent(email.trim(), lockedUntil)
    } catch {
      setFailed(true)
      setSubmitting(false)
    }
  })

  return (
    <>
      <AuthHeader
        title="Esqueceu sua senha?"
        description="Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um código para criar uma nova senha."
      />
      <InlineMessageSlot reserve hasIcon message={failed && 'Não conseguimos enviar o código agora. Verifique sua conexão e tente de novo.'} />
      <form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting || undefined}>
        <TextField
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="seu melhor e-mail"
          readOnly={submitting}
          status={errors.email ? 'error' : 'default'}
          helperText={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" variant="outline" loading={submitting} disabled={!isValid} onDisabledClick={() => void submit()}>
          Continuar
        </Button>
      </form>
      <InlineMessage tone="info" hasIcon>
        Por segurança, o código expira em 10 minutos e só pode ser usado uma vez.
      </InlineMessage>
    </>
  )
}
