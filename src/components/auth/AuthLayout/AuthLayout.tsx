import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'
import { NavButton } from '@/components/ui/NavButton'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import styles from './AuthLayout.module.css'

export interface AuthIllustration {
  /** Cena estática (fundo + personagem). */
  still: string
  /** Recorte animado da personagem, no mesmo enquadramento da cena. */
  animated: string
}

interface AuthLayoutProps {
  illustration: AuthIllustration
  /** Legenda do painel da marca (Figma `Caption` e `CaptionDescription`). */
  caption?: string
  captionDescription?: string
  /** Rota do botão voltar (Figma `AuthTopBar` > `HasBack`). */
  backTo?: string
  /** Voltar como ação (ex.: "Trocar e-mail" dentro do mesmo fluxo). */
  onBack?: () => void
  backLabel?: string
  /** Faixa abaixo da barra superior, ex.: indicador de etapa (Figma `HasProgress`). */
  progress?: ReactNode
  /** Figma `Copyright`. */
  copyright?: string
  children: ReactNode
}

/**
 * `AuthLayout` do DS (3265:56657). Quadro dividido ao meio: painel da marca (ilustração + legenda)
 * e cartão do formulário com três zonas fixas: topo (voltar, logo, etapa), corpo centralizado e copyright.
 */
export function AuthLayout({
  illustration,
  caption = 'Acompanhe o que importa para você',
  captionDescription = 'Notícias, análises e conteúdos personalizados',
  backTo,
  onBack,
  backLabel = 'Voltar',
  progress,
  copyright = '© 2026 Portal Tela. Todos os direitos reservados',
  children,
}: AuthLayoutProps) {
  return (
    <div className={styles.layout}>
      <Illustration {...illustration} />
      <div className={styles.brandPanel}>
        <p className={styles.caption}>{caption}</p>
        <p className={styles.captionDescription}>{captionDescription}</p>
      </div>
      <div className={styles.cardColumn}>
        <div className={styles.card}>
          <header className={styles.topBar}>
            <div className={styles.topRow}>
              <div className={styles.slot}>
                {backTo ? (
                  <NavButton to={backTo} label={backLabel} />
                ) : (
                  onBack && <NavButton onClick={onBack} label={backLabel} />
                )}
              </div>
              <div className={styles.logoSlot}>
                <Logo />
              </div>
              <div className={styles.slot} aria-hidden="true" />
            </div>
            {progress}
          </header>
          <main className={styles.body} id="conteudo">
            <div className={styles.content}>{children}</div>
          </main>
          <p className={styles.copyright}>{copyright}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Cena estática carrega primeiro; o GIF da personagem (4 MB) entra depois do `load` da página,
 * com fade, para não competir com o primeiro paint. Com "reduzir movimento", fica só a cena.
 */
function Illustration({ still, animated }: AuthIllustration) {
  const reduceMotion = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)
  const [animatedLoaded, setAnimatedLoaded] = useState(false)

  useEffect(() => {
    if (reduceMotion) return
    const start = () => setReady(true)
    if (document.readyState === 'complete') {
      const id = window.setTimeout(start, 0)
      return () => window.clearTimeout(id)
    }
    window.addEventListener('load', start, { once: true })
    return () => window.removeEventListener('load', start)
  }, [reduceMotion])

  return (
    <div className={styles.illustration} aria-hidden="true">
      <img src={still} alt="" className={styles.layer} decoding="async" fetchPriority="high" />
      {ready && !reduceMotion && (
        <img
          src={animated}
          alt=""
          className={styles.layer}
          data-loaded={animatedLoaded || undefined}
          decoding="async"
          onLoad={() => setAnimatedLoaded(true)}
        />
      )}
    </div>
  )
}
