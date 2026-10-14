import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'
import { NavButton } from '@/components/ui/NavButton'
import styles from './AuthCard.module.css'

interface AuthCardProps {
  /** Rota do botão voltar (Figma `AuthTopBar` > `HasBack`). */
  backTo?: string
  /** Voltar como ação (ex.: "Trocar e-mail" dentro do mesmo fluxo). */
  onBack?: () => void
  backLabel?: string
  /** Faixa abaixo da barra superior, ex.: indicador de etapa (Figma `HasProgress`). */
  progress?: ReactNode
  /** Figma `Copyright`. */
  copyright?: string
  /** Muda a cada etapa: o conteúdo remonta e entra com animação. */
  stepKey?: string
  children: ReactNode
}

/**
 * Cartão do `AuthLayout` do DS (3265:56657): três zonas fixas, topo (voltar, logo, etapa), corpo centralizado e
 * copyright. A moldura (ilustração, legenda, ajuste à janela) fica no `AuthShell`, que não remonta entre telas.
 */
export function AuthCard({
  backTo,
  onBack,
  backLabel = 'Voltar',
  progress,
  copyright = '© 2026 Portal Tela. Todos os direitos reservados',
  stepKey,
  children,
}: AuthCardProps) {
  return (
    <div className={styles.card}>
      <header className={styles.topBar}>
        <div className={styles.topRow}>
          <div className={styles.slot}>
            {backTo ? <NavButton to={backTo} label={backLabel} /> : onBack && <NavButton onClick={onBack} label={backLabel} />}
          </div>
          <div className={styles.logoSlot}>
            <Logo />
          </div>
          <div className={styles.slot} aria-hidden="true" />
        </div>
        {progress}
      </header>
      <main className={styles.body} id="conteudo">
        <div key={stepKey} className={styles.content}>
          {children}
        </div>
      </main>
      <p className={styles.copyright}>{copyright}</p>
    </div>
  )
}
