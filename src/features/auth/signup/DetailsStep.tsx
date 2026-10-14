import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AccountPrompt } from '@/components/auth/AccountPrompt'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { ConsentRow } from '@/components/auth/ConsentRow'
import { SocialLogin } from '@/components/auth/SocialLogin'
import { Button, InlineMessage, TextField } from '@/components/ui'
import { useSocialAuth } from '@/hooks/useSocialAuth'
import { NETWORK_FAILURE_EMAIL } from '../mock/authApi'
import { signupCodeFlow } from '../mock/codeFlow'
import styles from '../shared/steps.module.css'

const schema = z.object({
  name: z
    .string()
    .trim()
    .refine((value) => value.split(/\s+/).filter((part) => part.length > 0).length >= 2, 'Informe nome e sobrenome.'),
  email: z.string().trim().pipe(z.email('Digite um e-mail válido, como nome@email.com.')),
  terms: z.boolean().refine((value) => value, 'Aceite os termos para continuar.'),
})

export type SignUpDetails = z.infer<typeof schema>

interface DetailsStepProps {
  defaults: { name: string; email: string }
  onSent: (details: { name: string; email: string }, lockedUntil: number | null) => void
  onSocialSuccess: () => void
}

/** Etapa 1 de 3 (Figma `SignUpForm`: Default, Error, Loading). Nunca diz se o e-mail já existe. */
export function DetailsStep({ defaults, onSent, onSocialSuccess }: DetailsStepProps) {
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)
  const social = useSocialAuth(onSocialSuccess)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, submitCount },
  } = useForm<SignUpDetails>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { name: defaults.name, email: defaults.email, terms: false },
  })

  const submit = handleSubmit(async ({ name, email }) => {
    setSubmitting(true)
    setFailed(false)
    try {
      if (email.trim().toLowerCase() === NETWORK_FAILURE_EMAIL) throw new Error('network')
      const { lockedUntil } = await signupCodeFlow.request()
      onSent({ name: name.trim(), email: email.trim() }, lockedUntil)
    } catch {
      setFailed(true)
      setSubmitting(false)
    }
  })

  return (
    <>
      <AuthHeader title="Crie sua conta" description="Comece com seu nome e e-mail. Enviaremos um código para confirmar." />
      {failed && <InlineMessage hasIcon>Não conseguimos enviar o código agora. Verifique sua conexão e tente de novo.</InlineMessage>}
      <form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting || undefined}>
        <div className={styles.fields}>
          <TextField
            label="Nome completo"
            autoComplete="name"
            autoCapitalize="words"
            placeholder="nome e sobrenome"
            readOnly={submitting}
            status={errors.name ? 'error' : 'default'}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="seu melhor e-mail"
            readOnly={submitting}
            status={errors.email ? 'error' : 'default'}
            helperText={errors.email?.message}
            {...register('email')}
          />
        </div>
        {/* O erro dos termos só aparece depois de tentar enviar (não ao tabular pela caixa). */}
        <ConsentRow errorMessage={submitCount > 0 ? errors.terms?.message : undefined} {...register('terms')} />
        <Button
          type="submit"
          variant="outline"
          loading={submitting}
          loadingLabel="Enviar código"
          disabled={!isValid}
          onDisabledClick={() => void submit()}
        >
          Continuar
        </Button>
      </form>
      <SocialLogin
        loadingProvider={social.loadingProvider}
        error={social.failed ? 'Não foi possível conectar. Tente de novo ou use e-mail e senha.' : undefined}
        onProvider={social.signIn}
      />
      <AccountPrompt intent="sign-in" to="/entrar" />
    </>
  )
}
