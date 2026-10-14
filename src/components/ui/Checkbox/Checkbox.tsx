import { useEffect, useId, useRef } from 'react'
import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { assignRef } from '@/lib/assignRef'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  ref?: Ref<HTMLInputElement>
  /** Figma `Label` (aceita links dentro, ex.: "termos de uso"). */
  label?: ReactNode
  /** Figma `Checked=Indeterminate`. */
  indeterminate?: boolean
  /**
   * `consent`: frase de aceite em 14px secundário, sem altura mínima (o alvo de toque de 44px é
   * mantido por uma área invisível ao redor), como no `ConsentRow` do DS.
   */
  variant?: 'default' | 'consent'
}

/** `Checkbox` do DS (2938:73538), Style=Brand, Size=md. Input nativo + controle desenhado. */
export function Checkbox({ ref, label, indeterminate = false, variant = 'default', className, id, ...rest }: CheckboxProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const innerRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate
  }, [indeterminate])

  function setRefs(node: HTMLInputElement | null) {
    innerRef.current = node
    assignRef(ref, node)
  }

  return (
    <div className={cx(styles.root, className)} data-variant={variant}>
      <input {...rest} ref={setRefs} id={inputId} type="checkbox" className={styles.native} />
      <span className={styles.control} aria-hidden="true">
        <Icon name="check" width={14} height={11} className={cx(styles.mark, styles.check)} />
        <Icon name="indeterminate" width={12} height={2} className={cx(styles.mark, styles.dash)} />
      </span>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
    </div>
  )
}
