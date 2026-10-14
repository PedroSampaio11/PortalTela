import { useCallback, useId } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { AccountPrompt } from '@/components/auth/AccountPrompt'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { SocialLogin } from '@/components/auth/SocialLogin'
import { Button, Checkbox, InlineMessage, PasswordField, TextField, TextLink } from '@/components/ui'
import { useNow } from '@/hooks/useNow'
import { formatWait } from '../duration'
import { loginIllustration } from '../illustrations'
import { loginSchema } from '../schemas'
import type { LoginValues } from '../schemas'
import { useLogin } from './useLogin'
import styles from './LoginPage.module.css'

const MESSAGES = {
  credentials: 'E-mail ou senha incorretos. Confira os dados e tente de novo.',
  network: 'Não conseguimos entrar agora. Verifique sua conexão e tente de novo.',
  social: 'Não foi possível conectar. Tente de novo ou use e-mail e senha.',
} as const

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as { email?: string } | null)?.email ?? ''
  const messageId = useId()

  const goHome = useCallback(() => navigate('/', { replace: true }), [navigate])
  const login = useLogin({ onSuccess: goHome })

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched', // valida ao sair do campo; revalida a cada tecla só depois do 1º erro
    defaultValues: { email: prefill, password: '', remember: false },
  })

  const { phase } = login
  const blocked = phase === 'blocked'
  const submitting = phase === 'submitting'
  const socialLoading = phase === 'socialLoading'
  const hasServerError = phase === 'error'

  // Contagem regressiva só enquanto bloqueado (o texto só muda a cada minuto, sem re-anunciar).
  const now = useNow(blocked)
  const waitText = formatWait(Math.max(0, (login.lockedUntil ?? now) - now))

  const message = blocked
    ? `Muitas tentativas. Por segurança, aguarde ${waitText} ou redefina sua senha.`
    : hasServerError
      ? MESSAGES[login.errorKind]
      : null
  // Erro de credencial marca os dois campos sem dizer qual errou (não revela se a conta existe).
  const fieldsInError = hasServerError && login.errorKind === 'credentials'

  const submit = handleSubmit(login.submit)

  function goToRecovery() {
    navigate('/recuperar-senha', { state: { email: getValues('email') } })
  }

  return (
    <AuthLayout illustration={loginIllustration} backTo="/" backLabel="Voltar para o início">
      <AuthHeader title="Entrar" description="Acesse sua conta para acompanhar o que importa para você." />

      {message && (
        <InlineMessage id={messageId} hasIcon>
          {message}
        </InlineMessage>
      )}

      <form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting || undefined}>
        <div className={styles.fields}>
          <TextField
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="seu melhor e-mail"
            disabled={blocked}
            readOnly={submitting}
            status={errors.email || fieldsInError ? 'error' : 'default'}
            helperText={errors.email?.message}
            aria-describedby={fieldsInError ? messageId : undefined}
            {...register('email')}
          />
          <PasswordField
            label="Senha"
            autoComplete="current-password"
            placeholder="sua senha"
            disabled={blocked}
            readOnly={submitting}
            status={errors.password || fieldsInError ? 'error' : 'default'}
            helperText={errors.password?.message}
            aria-describedby={fieldsInError ? messageId : undefined}
            {...register('password')}
          />
        </div>

        <div className={styles.options}>
          <Checkbox label="Manter-me conectado" disabled={blocked} {...register('remember')} />
          <TextLink to="/recuperar-senha" state={{ email: getValues('email') }}>
            Esqueci minha senha
          </TextLink>
        </div>

        {blocked ? (
          <Button type="button" variant="outline" onClick={goToRecovery}>
            Redefinir senha
          </Button>
        ) : (
          <Button
            type="submit"
            variant="outline"
            loading={submitting}
            disabled={!isValid || socialLoading}
            onDisabledClick={() => void submit()}
          >
            Entrar
          </Button>
        )}
      </form>

      <SocialLogin
        loadingProvider={socialLoading ? login.provider : null}
        error={phase === 'socialError' ? MESSAGES.social : undefined}
        onProvider={login.signInWithProvider}
      />

      <AccountPrompt intent="sign-up" to="/cadastro" />
    </AuthLayout>
  )
}
