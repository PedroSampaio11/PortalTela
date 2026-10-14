import { useState } from 'react'
import type { ClipboardEvent, FocusEvent, KeyboardEvent } from 'react'
import { Icon } from '../Icon'
import { TextField } from './TextField'
import type { TextFieldProps } from './TextField'
import styles from './PasswordField.module.css'

interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'trailing' | 'helperTone'> {
  /**
   * Criar/redefinir senha: não deixa copiar, recortar, colar nem arrastar texto para o campo. A pessoa
   * precisa digitar a senha de novo (confirma que ela a conhece). O preenchimento automático do
   * gerenciador de senhas continua funcionando (ele não usa "colar").
   */
  blockClipboard?: boolean
}

export const CAPS_LOCK_MESSAGE = 'Caps Lock ativado. A senha diferencia maiúsculas de minúsculas.'
export const PASTE_BLOCKED_MESSAGE = 'Digite a senha, colar não é permitido.'

/** `Text Input` com mostrar/ocultar senha (ícones `view` e `view-off-slash` do DS) e aviso de Caps Lock. */
export function PasswordField({ disabled, blockClipboard = false, helperText, onKeyDown, onKeyUp, onBlur, onChange, onPaste, onCopy, onCut, onDrop, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [pasteBlocked, setPasteBlocked] = useState(false)

  // O navegador só informa o Caps Lock em eventos de teclado: o aviso aparece na primeira tecla.
  const trackCaps = (event: KeyboardEvent<HTMLInputElement>) => setCapsLock(event.getModifierState('CapsLock'))
  const block = (event: ClipboardEvent<HTMLInputElement>) => event.preventDefault()

  // Erro de validação tem prioridade; depois o aviso de colar; por fim o de Caps Lock. Sempre no espaço do helper.
  const hint = pasteBlocked ? PASTE_BLOCKED_MESSAGE : capsLock ? CAPS_LOCK_MESSAGE : undefined

  return (
    <TextField
      {...rest}
      disabled={disabled}
      helperText={helperText ?? hint}
      helperTone={helperText ? undefined : hint ? 'warning' : undefined}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        trackCaps(event)
        onKeyDown?.(event)
      }}
      onKeyUp={(event: KeyboardEvent<HTMLInputElement>) => {
        trackCaps(event)
        onKeyUp?.(event)
      }}
      onChange={(event) => {
        setPasteBlocked(false)
        onChange?.(event)
      }}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        setCapsLock(false)
        setPasteBlocked(false)
        onBlur?.(event)
      }}
      onPaste={(event) => {
        if (blockClipboard) {
          block(event)
          setPasteBlocked(true)
        }
        onPaste?.(event)
      }}
      onCopy={(event) => {
        if (blockClipboard) block(event)
        onCopy?.(event)
      }}
      onCut={(event) => {
        if (blockClipboard) block(event)
        onCut?.(event)
      }}
      onDrop={(event) => {
        if (blockClipboard) {
          event.preventDefault()
          setPasteBlocked(true)
        }
        onDrop?.(event)
      }}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={visible}
          aria-label="Mostrar senha"
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
        >
          <Icon name={visible ? 'view-off-slash' : 'view'} />
        </button>
      }
    />
  )
}
