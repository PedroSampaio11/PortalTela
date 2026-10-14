import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MOCK_USER, NETWORK_FAILURE_EMAIL } from '@/features/auth/mock/authApi'
import { CODE_RULES } from '@/features/auth/mock/codeFlow'
import { SCENES, SCENE_IDS, sceneForPath } from '@/features/auth/scenes'
import type { SceneId } from '@/features/auth/scenes'
import {
  BACKDROP_INTERVALS,
  setBackdropChoice,
  setBackdropInterval,
  startAutoBackdrop,
  useActiveScene,
  useBackdropChoice,
  useBackdropInterval,
} from './backdrop'
import { isDemoEnabled, isFastMode, resetDemo, setFastMode } from './demoMode'
import { DEMO_STATES, FLOW_LABELS, demoHref } from './scenarios'
import type { DemoFlow } from './scenarios'
import { useDemoStateId } from './useDemoScenario'
import { useDraggable } from './useDraggable'
import styles from './DemoGuide.module.css'

interface Scenario {
  label: string
  value: string
  note: string
}

const SCENARIOS: Scenario[] = [
  { label: 'E-mail', value: MOCK_USER.email, note: 'conta principal' },
  { label: 'Senha', value: MOCK_USER.password, note: 'entra (marque "Manter-me conectado", obrigatório); outra senha erra e a 3ª bloqueia' },
  { label: 'Código correto', value: CODE_RULES.validCode, note: 'segue o fluxo' },
  { label: 'Código incorreto', value: '111111', note: 'qualquer outro; 3 erros bloqueiam' },
  { label: 'Código expirado', value: CODE_RULES.expiredCode, note: 'libera o reenvio' },
  { label: 'Falha de rede', value: NETWORK_FAILURE_EMAIL, note: 'qualquer senha; também no cadastro' },
]

const FLOWS: readonly DemoFlow[] = ['login', 'signup', 'recovery']
/** "Pessoa 1 a 4": os quadros Person 1 a 4 do Figma. */
const backdropLabel = (id: SceneId) => `Pessoa ${id.replace('person-', '')}`

/** A prévia de um fundo: a cena com a personagem por cima, como aparece na tela. */
function BackdropThumb({ id }: { id: SceneId }) {
  return (
    <span className={styles.bgThumb} aria-hidden="true">
      <img src={SCENES[id].plate} alt="" loading="lazy" decoding="async" />
      <img src={SCENES[id].character} alt="" loading="lazy" decoding="async" />
    </span>
  )
}
const TOUR_STEP_MS = 3500

/**
 * Guia de demonstração para apresentar o produto. Só aparece com `?demo` na URL (sem isso a interface
 * é a do produto). Permite abrir QUALQUER estado das 3 telas direto, sem provocá-lo: anterior/próximo,
 * passeio automático e atalhos `Alt + ←/→`. Também traz os cenários copiáveis, modo rápido e reinício.
 */
export function DemoGuide() {
  const navigate = useNavigate()
  const [enabled] = useState(isDemoEnabled)
  const [open, setOpen] = useState(false)
  const [fast, setFast] = useState(isFastMode)
  const [playing, setPlaying] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const panelId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const drag = useDraggable(rootRef, enabled && !hidden)

  const { pathname } = useLocation()
  const backdrop = useBackdropChoice()
  const backdropEvery = useBackdropInterval()
  const liveScene = useActiveScene(pathname)
  const currentId = useDemoStateId()
  const index = currentId ? DEMO_STATES.findIndex((item) => item.id === currentId) : -1
  const current = index >= 0 ? DEMO_STATES[index] : undefined

  // Índice sempre atual para os atalhos: apertar Alt+→ e logo Alt+← não pode usar o índice anterior.
  const indexRef = useRef(index)
  useEffect(() => {
    indexRef.current = index
  }, [index])

  function go(target: number) {
    const next = DEMO_STATES[(target + DEMO_STATES.length) % DEMO_STATES.length]
    if (next) navigate(demoHref(next.id))
  }

  // Passeio automático: avança um estado a cada poucos segundos e para no último.
  useEffect(() => {
    if (!playing) return
    if (index >= DEMO_STATES.length - 1 && index !== -1) {
      const stop = window.setTimeout(() => setPlaying(false), TOUR_STEP_MS)
      return () => window.clearTimeout(stop)
    }
    const id = window.setTimeout(() => go(index + 1), TOUR_STEP_MS)
    return () => window.clearTimeout(id)
    // `go` só depende de `navigate`, estável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index])

  // Atalhos Alt + setas funcionam com o painel aberto ou fechado.
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.code === 'KeyD') {
        event.preventDefault()
        setHidden((value) => !value)
        return
      }
      if (!event.altKey || (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')) return
      event.preventDefault()
      const target = indexRef.current + (event.key === 'ArrowRight' ? 1 : -1)
      indexRef.current = target // vale já para o próximo atalho, antes de a URL atualizar
      go(target)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  useEffect(() => {
    if (!open) return
    headingRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [open, currentId])

  if (!enabled || hidden) return null

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied((value_) => (value_ === value ? null : value_)), 1500)
    } catch {
      /* sem permissão de área de transferência: o valor continua visível para digitar */
    }
  }

  function toggleFast() {
    setFastMode(!fast)
    setFast(!fast)
  }

  function restart() {
    resetDemo()
    navigate('/entrar')
    window.location.reload()
  }

  return (
    <div ref={rootRef} className={styles.root} style={drag.position ? { left: drag.position.left, top: drag.position.top } : undefined}>
      {open && (
        <section id={panelId} className={styles.panel} aria-labelledby={`${panelId}-title`}>
          <div className={styles.header} data-draggable {...drag.handleProps}>
            <h2 id={`${panelId}-title`} ref={headingRef} tabIndex={-1} className={styles.title}>
              Guia de demonstração
            </h2>
            <div className={styles.headerActions}>
              <button type="button" className={styles.chip} onClick={() => setHidden(true)} title="Esconde o guia por completo. Alt + D mostra de novo">
                Ocultar
              </button>
              <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Minimizar guia" title="Minimizar">
                –
              </button>
            </div>
          </div>

          <div className={styles.tour} role="group" aria-label="Navegar pelos estados">
            <p className={styles.status} aria-live="polite">
              {current ? (
                <>
                  <strong>{index + 1} de {DEMO_STATES.length}</strong> · {FLOW_LABELS[current.flow]} › {current.label}
                </>
              ) : (
                'Uso normal. Escolha um estado para vê-lo direto.'
              )}
            </p>
            <div className={styles.controls}>
              <button type="button" className={styles.chip} onClick={() => go(index - 1)}>
                ‹ Anterior
              </button>
              <button
                type="button"
                className={styles.chipSolid}
                aria-pressed={playing}
                onClick={() => {
                  if (!playing && index === -1) go(0)
                  // Ao iniciar o passeio, o painel recolhe sozinho: a apresentação fica só com a tela.
                  if (!playing) setOpen(false)
                  setPlaying((value) => !value)
                }}
              >
                {playing ? 'Pausar passeio' : 'Passeio automático'}
              </button>
              <button type="button" className={styles.chip} onClick={() => go(index + 1)}>
                Próximo ›
              </button>
            </div>
            <p className={styles.hint}>Atalhos: Alt + ← / → navega; Alt + D mostra ou oculta o guia. Os estados abrem fixos; os campos e botões continuam funcionando.</p>
          </div>

          <div className={styles.group} role="group" aria-labelledby={`${panelId}-bg`}>
            <h3 id={`${panelId}-bg`} className={styles.groupTitle}>
              Fundo da tela
            </h3>
            <ul className={styles.bgList}>
              <li>
                <button type="button" className={styles.bg} aria-pressed={backdrop === null} onClick={() => setBackdropChoice(null)}>
                  <BackdropThumb id={sceneForPath(pathname)} />
                  <span className={styles.bgName}>Padrão</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.bg}
                  aria-pressed={backdrop === 'auto'}
                  onClick={() => {
                    if (backdrop !== 'auto') startAutoBackdrop(liveScene)
                  }}
                >
                  <span className={styles.bgMosaic} aria-hidden="true">
                    {SCENE_IDS.map((id) => (
                      <BackdropThumb key={id} id={id} />
                    ))}
                  </span>
                  <span className={styles.bgName}>Automático</span>
                </button>
              </li>
              {SCENE_IDS.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    className={styles.bg}
                    aria-pressed={backdrop === id}
                    aria-current={backdrop === 'auto' && liveScene === id ? 'true' : undefined}
                    onClick={() => setBackdropChoice(id)}
                  >
                    <BackdropThumb id={id} />
                    <span className={styles.bgName}>{backdropLabel(id)}</span>
                    {backdrop === 'auto' && liveScene === id && (
                      <span className={styles.bgLive} aria-hidden="true">
                        Agora
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {backdrop === 'auto' && (
              <div className={styles.row} role="group" aria-label="Trocar a cada">
                <span className={styles.bgEvery}>Trocar a cada</span>
                {BACKDROP_INTERVALS.map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    className={styles.state}
                    aria-pressed={backdropEvery === seconds}
                    onClick={() => setBackdropInterval(seconds)}
                  >
                    {seconds} s
                  </button>
                ))}
              </div>
            )}
            <p className={styles.hint}>Vale para as 3 telas. Padrão: cada tela usa o seu fundo. Automático: passa pelas 4 pessoas sozinho.</p>
          </div>

          <div className={styles.states}>
            {FLOWS.map((flow) => (
              <div key={flow} className={styles.group}>
                <h3 className={styles.groupTitle}>{FLOW_LABELS[flow]}</h3>
                <ul className={styles.stateList}>
                  {DEMO_STATES.filter((item) => item.flow === flow).map((item) => {
                    const active = item.id === currentId
                    return (
                      <li key={item.id}>
                        <button
                          ref={active ? activeRef : undefined}
                          type="button"
                          className={styles.state}
                          aria-current={active || undefined}
                          onClick={() => navigate(demoHref(item.id))}
                        >
                          {item.label}
                          {item.extra && <span className={styles.extra} title="Estado que o produto real teria, fora do Figma"> *</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            <p className={styles.hint}>* Estado que o produto real teria e que não existe no Figma.</p>
          </div>

          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Credenciais e códigos</h3>
            <ul className={styles.list}>
              {SCENARIOS.map((scenario) => (
                <li key={scenario.label} className={styles.item}>
                  <div>
                    <span className={styles.label}>{scenario.label}</span>
                    <span className={styles.note}>{scenario.note}</span>
                  </div>
                  <button type="button" className={styles.copy} onClick={() => void copy(scenario.value)} aria-label={`Copiar ${scenario.label}: ${scenario.value}`}>
                    <code>{copied === scenario.value ? 'copiado' : scenario.value}</code>
                  </button>
                </li>
              ))}
            </ul>
            <p className={styles.hint}>Google entra e Apple falha.</p>
          </div>

          <label className={styles.toggle}>
            <input type="checkbox" checked={fast} onChange={toggleFast} />
            Modo rápido (respostas em ~0,2 s, reenvio em 3 s, bloqueio de 20 s)
          </label>
          <button type="button" className={styles.reset} onClick={restart}>
            Reiniciar demonstração
          </button>
        </section>
      )}
      <div className={styles.bar} data-playing={playing || undefined}>
        <button
          type="button"
          className={styles.grip}
          data-grip
          aria-label="Mover guia"
          title="Arraste para mover o guia. Setas movem (Shift: mais rápido); Home ou duplo clique voltam ao canto."
          {...drag.gripProps}
        >
          ⠿
        </button>
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          Demo{current ? ` · ${index + 1}/${DEMO_STATES.length}` : ''}
        </button>
        {!open && (
          <>
            {current && (
              <span className={styles.barLabel}>
                {FLOW_LABELS[current.flow]} › {current.label}
              </span>
            )}
            <button type="button" className={styles.barButton} onClick={() => go(index - 1)} aria-label="Estado anterior" title="Anterior (Alt + ←)">
              ‹
            </button>
            <button
              type="button"
              className={styles.barButton}
              aria-pressed={playing}
              aria-label={playing ? 'Passeio: pausar' : 'Passeio: iniciar'}
              title={playing ? 'Pausar passeio' : 'Iniciar passeio automático'}
              onClick={() => {
                if (!playing && index === -1) go(0)
                setPlaying((value) => !value)
              }}
            >
              {playing ? '❚❚' : '▶'}
            </button>
            <button type="button" className={styles.barButton} onClick={() => go(index + 1)} aria-label="Próximo estado" title="Próximo (Alt + →)">
              ›
            </button>
            <button type="button" className={styles.barButton} onClick={() => setHidden(true)} aria-label="Ocultar guia" title="Ocultar (Alt + D mostra de novo)">
              ×
            </button>
          </>
        )}
      </div>
    </div>
  )
}
