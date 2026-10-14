import styles from './StepIndicator.module.css'

interface StepIndicatorProps {
  /** Figma `Total` (3 ou 4). */
  total: number
  /** Figma `Current` (1 até `total`). */
  current: number
}

/** `StepIndicator` do DS (3048:63122): "Etapa N de M" e barras (atual e anteriores em marca). */
export function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <div className={styles.root}>
      <p className={styles.label}>
        Etapa {current} de {total}
      </p>
      <div className={styles.steps} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={`Etapa ${current} de ${total}`}>
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={styles.step} data-done={index < current || undefined} />
        ))}
      </div>
    </div>
  )
}
