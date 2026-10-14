import { Icon } from '@/components/ui/Icon'
import styles from './AuthResult.module.css'

interface AuthResultProps {
  /** Figma `Title` (title/xl/bold, 24). */
  title: string
  /** Figma `Description`. */
  description: string
}

/**
 * `AuthResult` do DS (3265:55922): tela final/intermediária de um fluxo (sem botão voltar, o passo já
 * foi concluído). Selo de sucesso de 100px, título e descrição. Anunciada como `status`.
 */
export function AuthResult({ title, description }: AuthResultProps) {
  return (
    <div className={styles.root} role="status">
      <div className={styles.badge}>
        <Icon name="checkmark-circle-36" size={36} className={styles.icon} />
      </div>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  )
}
