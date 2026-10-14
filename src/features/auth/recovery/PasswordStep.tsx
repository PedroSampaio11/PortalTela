import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { PasswordRequirements } from '@/components/auth/PasswordRequirements'
import { Button, PasswordField } from '@/components/ui'
import { simulateLatency, updatePassword } from '../mock/authApi'
import { evaluatePassword } from '../passwordRules'
import styles from './RecoveryPage.module.css'

interface PasswordStepProps {
  email: string
  onUpdated: () => void
}

/** Etapa 3 de 3 (Figma `NewPasswordForm` Flow=Recovery: Default, Weak, Mismatch, Valid, Loading). */
export function PasswordStep({ email, onUpdated }: PasswordStepProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
    updatePassword(email, password)
    onUpdated()
  }

  return (
    <>
      <AuthHeader title="Crie uma nova senha" description="Defina uma nova senha para voltar a acessar sua conta." />
      <form className={styles.form} onSubmit={(event) => void submit(event)} noValidate aria-busy={submitting || undefined}>
        <div className={styles.fields}>
          <PasswordField
            ref={passwordRef}
            label="Nova senha"
            autoComplete="new-password"
            placeholder="mínimo de 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            readOnly={submitting}
            status={passwordError ? 'error' : 'default'}
            helperText={passwordError}
          />
          <PasswordField
            ref={confirmRef}
            label="Confirmar nova senha"
            autoComplete="new-password"
            placeholder="repita a senha"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            onBlur={() => setConfirmTouched(true)}
            readOnly={submitting}
            status={confirmError ? 'error' : 'default'}
            helperText={confirmError}
          />
        </div>
        <PasswordRequirements met={rules.met} />
        <Button type="submit" variant="outline" loading={submitting} disabled={!ready} onDisabledClick={() => void submit()}>
          Atualizar senha
        </Button>
      </form>
    </>
  )
}
