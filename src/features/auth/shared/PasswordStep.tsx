import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { PasswordRequirements } from '@/components/auth/PasswordRequirements'
import { Button, PasswordField } from '@/components/ui'
import type { PasswordScenario } from '@/features/demo/scenarios'
import { simulateLatency } from '../mock/authApi'
import { evaluatePassword } from '../passwordRules'
import styles from './steps.module.css'

interface PasswordStepProps {
  title: string
  description: string
  passwordLabel: string
  passwordPlaceholder: string
  confirmLabel: string
  confirmPlaceholder: string
  /** Rótulo do botão final (Recovery: "Atualizar senha"; SignUp: "Criar conta"). */
  submitLabel: string
  /** Rótulo enquanto envia (SignUp: "Criando"). */
  loadingLabel?: string
  /** O que fazer com a senha escolhida (atualizar a conta ou criá-la). */
  onSubmit: (password: string) => void
  onDone: () => void
  /** Estado forçado pela demonstração. */
  scenario?: PasswordScenario
}

/** Etapa 3 de 3 (Figma `NewPasswordForm`: Default, Weak, Mismatch, Valid, Loading), para os dois fluxos. */
export function PasswordStep({
  title,
  description,
  passwordLabel,
  passwordPlaceholder,
  confirmLabel,
  confirmPlaceholder,
  submitLabel,
  loadingLabel,
  onSubmit,
  onDone,
  scenario,
}: PasswordStepProps) {
  const [password, setPassword] = useState(scenario?.password ?? '')
  const [confirm, setConfirm] = useState(scenario?.confirm ?? '')
  const [confirmTouched, setConfirmTouched] = useState(scenario?.confirmTouched ?? false)
  const [attempted, setAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(scenario?.submitting ?? false)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const rules = evaluatePassword(password)
  // O botão "acende" com a senha forte e a confirmação preenchida (Figma: Weak desabilitado, Mismatch ativo).
  const ready = rules.isStrong && confirm.length > 0
  const mismatch = confirm.length > 0 && confirm !== password && (confirmTouched || attempted)

  const passwordError = attempted && !rules.isStrong ? 'Atenda a todos os requisitos para continuar.' : undefined
  const confirmError = mismatch
    ? 'As senhas não são iguais.'
    : attempted && confirm.length === 0 && rules.isStrong
      ? 'Repita a senha para confirmar.'
      : undefined

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    setAttempted(true)
    if (!rules.isStrong) return passwordRef.current?.focus()
    if (confirm.length === 0 || confirm !== password) return confirmRef.current?.focus()
    setSubmitting(true)
    await simulateLatency()
    onSubmit(password)
    onDone()
  }

  return (
    <>
      <AuthHeader title={title} description={description} />
      <form className={styles.form} onSubmit={(event) => void submit(event)} noValidate aria-busy={submitting || undefined}>
        <div className={styles.fields}>
          <PasswordField
            ref={passwordRef}
            label={passwordLabel}
            autoComplete="new-password"
            placeholder={passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            readOnly={submitting}
            status={passwordError ? 'error' : 'default'}
            helperText={passwordError}
          />
          <PasswordField
            ref={confirmRef}
            label={confirmLabel}
            autoComplete="new-password"
            placeholder={confirmPlaceholder}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            onBlur={() => setConfirmTouched(true)}
            readOnly={submitting}
            status={confirmError ? 'error' : 'default'}
            helperText={confirmError}
          />
        </div>
        <PasswordRequirements met={rules.met} />
        <Button type="submit" variant="outline" loading={submitting} loadingLabel={loadingLabel} disabled={!ready} onDisabledClick={() => void submit()}>
          {submitLabel}
        </Button>
      </form>
    </>
  )
}
