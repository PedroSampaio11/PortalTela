import { useId, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent, Ref } from 'react'
import { assignRef } from '@/lib/assignRef'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import styles from './CodeSlots.module.css'

export interface CodeSlotsProps {
  value: string
  onChange: (value: string) => void
  /** Figma `Length` (4 ou 6 casas). */
  length?: 4 | 6
  /** Figma `State`: Default/Focus vêm do foco real; Error e Success são controlados. */
  status?: 'default' | 'error' | 'success'
  /** Figma `State=Disabled`. */
  disabled?: boolean
  /** Muda a cada novo erro para a vibração (Figma `Shake`) tocar de novo. */
  shakeKey?: number
  /** Nome acessível do campo (as casas desenhadas são só visuais). */
  label: string
  autoFocus?: boolean
  /** Ref do input real (para devolver o foco depois de reenviar, por exemplo). */
  inputRef?: Ref<HTMLInputElement>
  'aria-describedby'?: string
  className?: string
}

/**
 * `CodeSlots` do DS (2935:59796): campo de código (OTP).
 *
 * Acessibilidade: o controle real é UM `<input>` (inputMode numérico, autocomplete `one-time-code`,
 * colar funciona e leitor de tela lê o valor); as casas são só desenho. O dígito aparece com o
 * preenchimento roxo crescendo do centro; ao completar com sucesso viram uma barra única com check.
 */
export function CodeSlots({
  value,
  onChange,
  length = 6,
  status = 'default',
  disabled = false,
  shakeKey = 0,
  label,
  autoFocus,
  inputRef: externalRef,
  'aria-describedby': describedBy,
  className,
}: CodeSlotsProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [focused, setFocused] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value.replace(/\D/g, '').slice(0, length))
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) onChange(pasted)
  }

  // Ao focar ou clicar o cursor vai para o fim (apagar e digitar em sequência). Selecionar tudo continua possível.
  function moveCaretToEnd() {
    const input = inputRef.current
    if (input) input.setSelectionRange(input.value.length, input.value.length)
  }

  const activeIndex = focused && !disabled && status !== 'success' && value.length < length ? value.length : -1

  return (
    <div
      className={cx(styles.root, className)}
      data-status={status}
      data-disabled={disabled || undefined}
      data-complete={value.length === length || undefined}
    >
      <input
        ref={(node) => {
          inputRef.current = node
          assignRef(externalRef, node)
        }}
        id={id}
        className={styles.input}
        value={value}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        aria-label={label}
        aria-invalid={status === 'error' || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        readOnly={status === 'success'}
        autoFocus={autoFocus}
        spellCheck={false}
        onChange={handleChange}
        onPaste={handlePaste}
        onFocus={() => {
          setFocused(true)
          moveCaretToEnd()
        }}
        onBlur={() => setFocused(false)}
        onClick={moveCaretToEnd}
      />
      {/* key remonta as casas a cada erro: a animação de vibração toca de novo. */}
      <div key={shakeKey} className={styles.slots} data-shake={shakeKey > 0 || undefined} aria-hidden="true">
        {Array.from({ length }, (_, index) => {
          const digit = value[index]
          return (
            <span
              key={index}
              className={styles.slot}
              data-filled={digit !== undefined || undefined}
              data-active={index === activeIndex || undefined}
              data-edge={index === 0 ? 'start' : index === length - 1 ? 'end' : undefined}
            >
              <span className={styles.fill} />
              <span className={styles.digit}>{digit}</span>
              <span className={styles.caret} />
            </span>
          )
        })}
        <Icon name="tick-02" size={40} className={styles.check} />
      </div>
    </div>
  )
}
