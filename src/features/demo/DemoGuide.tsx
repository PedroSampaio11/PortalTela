import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_USER, NETWORK_FAILURE_EMAIL } from '@/features/auth/mock/authApi'
import { CODE_RULES } from '@/features/auth/mock/codeFlow'
import { isDemoEnabled, isFastMode, resetDemo, setFastMode } from './demoMode'
import { DEMO_STATES, FLOW_LABELS, demoHref } from './scenarios'
import type { DemoFlow } from './scenarios'
import { useDemoStateId } from './useDemoScenario'
import styles from './DemoGuide.module.css'

interface Scenario {
  label: string
  value: string
  note: string
}

const SCENARIOS: Scenario[] = [
  { label: 'E-mail', value: MOCK_USER.email, note: 'conta principal' },
  { label: 'Senha', value: MOCK_USER.password, note: 'entra; outra senha erra e a 3ª bloqueia' },
  { label: 'Código correto', value: CODE_RULES.validCode, note: 'segue o fluxo' },
  { label: 'Código incorreto', value: '111111', note: 'qualquer outro; 3 erros bloqueiam' },
  { label: 'Código expirado', value: CODE_RULES.expiredCode, note: 'libera o reenvio' },
  { label: 'Falha de rede', value: NETWORK_FAILURE_EMAIL, note: 'qualquer senha; também no cadastro' },
]

const FLOWS: readonly DemoFlow[] = ['login', 'signup', 'recovery']
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
  const [copied, setCopied] = useState<string | null>(null)
  const panelId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

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

  if (!enabled) return null

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
    <div className={styles.root}>
      {open && (
        <section id={panelId} className={styles.panel} aria-labelledby={`${panelId}-title`}>
          <div className={styles.header}>
            <h2 id={`${panelId}-title`} ref={headingRef} tabIndex={-1} className={styles.title}>
              Guia de demonstração
            </h2>
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Fechar guia">
              ×
            </button>
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
                  setPlaying((value) => !value)
                }}
              >
                {playing ? 'Pausar passeio' : 'Passeio automático'}
              </button>
              <button type="button" className={styles.chip} onClick={() => go(index + 1)}>
                Próximo ›
              </button>
            </div>
            <p className={styles.hint}>Atalho: Alt + ← / →. Os estados abrem fixos; os campos e botões continuam funcionando.</p>
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
    </div>
  )
}
