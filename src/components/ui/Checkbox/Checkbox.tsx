import { useEffect, useId, useRef } from 'react'
import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  ref?: Ref<HTMLInputElement>
  /** Figma `Label` (aceita links dentro, ex.: "termos de uso"). */
  label?: ReactNode
  /** Figma `Checked=Indeterminate`. */
  indeterminate?: boolean
}

/** `Checkbox` do DS (2938:73538), Style=Brand, Size=md. Input nativo + controle desenhado. */
export function Checkbox({ ref, label, indeterminate = false, className, id, ...rest }: CheckboxProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const innerRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate
  }, [indeterminate])

  function setRefs(node: HTMLInputElement | null) {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  return (
    <div className={cx(styles.root, className)}>
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
