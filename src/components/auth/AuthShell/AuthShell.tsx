import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useFitScale } from '@/hooks/useFitScale'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { SCENES, sceneForPath } from '@/features/auth/scenes'
import type { Scene } from '@/features/auth/scenes'
import styles from './AuthShell.module.css'

const SCENE_LIST = Object.values(SCENES)

/** Decodifica uma imagem antes de mostrá-la (sem quadro vazio). Falha de rede não trava a tela. */
function preload(src: string): Promise<void> {
  const image = new Image()
  image.src = src
  return image.decode().catch(() => undefined)
}

/**
 * Moldura das telas de autenticação (DS 3265:56657): painel da marca (ilustração + legenda) e a coluna do
 * cartão. É uma rota de layout: fica MONTADA entre Login, Cadastro e Recuperação, então a ilustração nunca
 * recarrega nem pisca; só o cartão troca.
 *
 * SEM rolagem: a janela é o limite. O "palco" tem a proporção de projeto (altura 1024, a do estado mais alto)
 * e, quando a janela é menor, reduz inteiro pelo fator `--fit` (ver useFitScale). Com 1024 de altura ou mais:
 * fator 1, idêntico ao Figma.
 */
export function AuthShell() {
  const fit = useFitScale()
  const location = useLocation()
  const active = sceneForPath(location.pathname)

  return (
    <div className={styles.viewport} style={{ '--fit': fit } as CSSProperties}>
      <div className={styles.stage}>
        <div className={styles.layout}>
          <Backdrop active={active} />
          <div className={styles.brandPanel}>
            <p className={styles.caption}>Acompanhe o que importa para você</p>
            <p className={styles.captionDescription}>Notícias, análises e conteúdos personalizados</p>
          </div>
          <div className={styles.cardColumn}>
            {/* O cartão remonta a cada navegação (inclusive para o mesmo estado da demonstração); a ilustração não. */}
            <Outlet key={location.key} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Todas as cenas ficam montadas e empilhadas; só a ativa aparece. Cena e personagem de TODAS são decodificadas
 * antes da primeira exibição (a ilustração entra de uma vez, com um fade, em vez de "montar" aos pedaços).
 * O recorte animado entra por último, com fade, e some com "reduzir movimento".
 */
function Backdrop({ active }: { active: Scene['id'] }) {
  const reduceMotion = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all(SCENE_LIST.flatMap((scene) => [preload(scene.plate), preload(scene.character)])).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={styles.backdrop} data-ready={ready || undefined} aria-hidden="true">
      {SCENE_LIST.map((scene) => (
        <SceneView key={scene.id} scene={scene} active={scene.id === active} animate={ready && !reduceMotion} />
      ))}
    </div>
  )
}

function SceneView({ scene, active, animate }: { scene: Scene; active: boolean; animate: boolean }) {
  const [motionLoaded, setMotionLoaded] = useState(false)
  const { x, y, width, height } = scene.motionBox
  const style = {
    '--ratio': scene.width / scene.height,
    '--mx': `${(x / scene.width) * 100}%`,
    '--my': `${(y / scene.height) * 100}%`,
    '--mw': `${(width / scene.width) * 100}%`,
    '--mh': `${(height / scene.height) * 100}%`,
  } as CSSProperties

  return (
    <div className={styles.scene} data-scene={scene.id} data-active={active || undefined} style={style}>
      <img className={styles.layer} data-layer="plate" src={scene.plate} alt="" decoding="async" fetchPriority={active ? 'high' : 'low'} />
      <img className={styles.layer} data-layer="character" src={scene.character} alt="" decoding="async" fetchPriority={active ? 'high' : 'low'} />
      {animate && (
        <img
          className={styles.motion}
          data-layer="motion"
          data-loaded={motionLoaded || undefined}
          src={scene.motion}
          alt=""
          decoding="async"
          onLoad={() => setMotionLoaded(true)}
        />
      )}
    </div>
  )
}
