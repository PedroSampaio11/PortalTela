import { Icon } from '@/components/ui/Icon'
import { PASSWORD_REQUIREMENTS, strengthLevel } from '@/features/auth/passwordRules'
import type { StrengthLevel } from '@/features/auth/passwordRules'
import styles from './PasswordRequirements.module.css'

const LEVELS: Record<Exclude<StrengthLevel, 'none'>, { label: string; segments: number }> = {
  weak: { label: 'Fraca', segments: 1 },
  fair: { label: 'Média', segments: 2 },
  good: { label: 'Boa', segments: 3 },
  strong: { label: 'Forte', segments: 4 },
}

interface PasswordRequirementsProps {
  /** Quais requisitos (na ordem de `PASSWORD_REQUIREMENTS`) estão cumpridos. */
  met: readonly boolean[]
  id?: string
}

/**
 * `PasswordRequirements` do DS (2935:66088): `StrengthMeter` (4 segmentos) + checklist de requisitos.
 * Feedback em tempo real é sinal positivo (product-ui-patterns); a cor nunca é o único sinal: o nome
 * do nível e o ícone de cada requisito dizem o estado.
 */
export function PasswordRequirements({ met, id }: PasswordRequirementsProps) {
  const metCount = met.filter(Boolean).length
  const level = strengthLevel(metCount)
  const info = level === 'none' ? null : LEVELS[level]

  return (
    <div className={styles.root} id={id}>
      <div className={styles.meter} data-level={level}>
        <div className={styles.bar} aria-hidden="true">
          {[0, 1, 2, 3].map((segment) => (
            <span key={segment} className={styles.segment} data-on={(info !== null && segment < info.segments) || undefined} />
          ))}
        </div>
        <div className={styles.labelRow}>
          <span className={styles.label}>Força da senha</span>
          {info && (
            <span className={styles.level} aria-live="polite">
              {info.label}
            </span>
          )}
        </div>
      </div>
      <ul className={styles.list}>
        {PASSWORD_REQUIREMENTS.map((requirement, index) => {
          const isMet = met[index] === true
          return (
            <li key={requirement.id} className={styles.item} data-met={isMet || undefined}>
              <Icon name={isMet ? 'checkmark-circle-16' : 'circle-dashed-16'} size={16} />
              <span>
                {requirement.label}
                <span className="visually-hidden">{isMet ? ': cumprido' : ': pendente'}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
