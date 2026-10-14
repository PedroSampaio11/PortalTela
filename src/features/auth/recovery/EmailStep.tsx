import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { Button, InlineMessage, TextField } from '@/components/ui'
import { NETWORK_FAILURE_EMAIL } from '../mock/authApi'
import { recoveryCodeFlow } from '../mock/codeFlow'
import { emailSchema } from '../schemas'
import styles from '../shared/steps.module.css'

const schema = z.object({ email: emailSchema })
type Values = z.infer<typeof schema>

interface EmailStepProps {
  defaultEmail: string
  onSent: (email: string, lockedUntil: number | null) => void
}

/** Etapa 1 de 3 (Figma `ForgotPasswordForm`: Default, Error, Loading). */
export function EmailStep({ defaultEmail, onSent }: EmailStepProps) {
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { email: defaultEmail } })

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
      {failed && <InlineMessage hasIcon>Não conseguimos enviar o código agora. Verifique sua conexão e tente de novo.</InlineMessage>}
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
