import { useCallback, useEffect, useId } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { AccountPrompt } from '@/components/auth/AccountPrompt'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { AuthCard } from '@/components/auth/AuthCard'
import { SocialLogin } from '@/components/auth/SocialLogin'
import { Button, Checkbox, InlineMessageSlot, PasswordField, TextField, TextLink } from '@/components/ui'
import { useNow } from '@/hooks/useNow'
import { getLoginScenario } from '@/features/demo/scenarios'
import { useDemoScenario } from '@/features/demo/useDemoScenario'
import { formatWait } from '../duration'
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
  const scenario = useDemoScenario('login', getLoginScenario)
  const prefill = (location.state as { email?: string } | null)?.email ?? scenario?.email ?? ''
  const messageId = useId()
  const rememberErrorId = useId()

  const goHome = useCallback(() => navigate('/', { replace: true }), [navigate])
  const login = useLogin({
    onSuccess: goHome,
    forced: scenario?.phase
      ? { phase: scenario.phase, errorKind: scenario.errorKind ?? 'credentials', provider: scenario.provider ?? null }
      : undefined,
  })

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isValid, submitCount },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched', // valida ao sair do campo; revalida a cada tecla só depois do 1º erro
    defaultValues: { email: prefill, password: scenario?.password ?? '', remember: scenario?.remember ?? false },
  })

  // Estado "campos obrigatórios" da demonstração: mostra os erros sem mexer no foco.
  useEffect(() => {
    if (scenario?.validate) void trigger()
  }, [scenario?.validate, trigger])

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
      : phase === 'socialError'
        ? MESSAGES.social
        : null
  // Erro de credencial marca os dois campos sem dizer qual errou (não revela se a conta existe).
  const fieldsInError = hasServerError && login.errorKind === 'credentials'

  // O erro da caixa só aparece depois de tentar entrar (não ao tabular por ela), como o aceite dos termos.
  const rememberError = submitCount > 0 || scenario?.validate ? errors.remember?.message : undefined

  const submit = handleSubmit(login.submit)

  function goToRecovery() {
    navigate('/recuperar-senha', { state: { email: getValues('email') } })
  }

  return (
    <AuthCard backTo="/" backLabel="Voltar para o início">
      <AuthHeader title="Entrar" description="Acesse sua conta para acompanhar o que importa para você." />

      <InlineMessageSlot reserve id={messageId} hasIcon message={message} />

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
          <Checkbox
            label="Manter-me conectado"
            disabled={blocked}
            aria-invalid={rememberError ? true : undefined}
            aria-describedby={rememberError ? rememberErrorId : undefined}
            {...register('remember')}
          />
          <TextLink to="/recuperar-senha" state={{ email: getValues('email') }}>
            Esqueci minha senha
          </TextLink>
          {/* Sobre o espaço entre a linha e o botão: o erro aparece sem mexer na altura da tela. */}
          {rememberError && (
            <p id={rememberErrorId} className={styles.optionsError}>
              {rememberError}
            </p>
          )}
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
        onProvider={login.signInWithProvider}
      />

      <AccountPrompt intent="sign-up" to="/cadastro" />
    </AuthCard>
  )
}
