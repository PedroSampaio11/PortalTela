import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_USER, NETWORK_FAILURE_EMAIL } from '@/features/auth/mock/authApi'
import { CODE_RULES } from '@/features/auth/mock/codeFlow'
import { isDemoEnabled, isFastMode, resetDemo, setFastMode } from './demoMode'
import styles from './DemoGuide.module.css'

interface Scenario {
  label: string
  value: string
  note: string
}

const SCENARIOS: Scenario[] = [
  { label: 'E-mail', value: MOCK_USER.email, note: 'conta de demonstração' },
  { label: 'Senha', value: MOCK_USER.password, note: 'entra; qualquer outra erra e a 3ª bloqueia' },
  { label: 'Código correto', value: CODE_RULES.validCode, note: 'segue o fluxo' },
  { label: 'Código expirado', value: CODE_RULES.expiredCode, note: 'mostra o aviso e libera o reenvio' },
  { label: 'Falha de rede', value: NETWORK_FAILURE_EMAIL, note: 'qualquer senha; também no cadastro' },
]

const LINKS = [
  { label: 'Entrar', to: '/entrar' },
  { label: 'Cadastro', to: '/cadastro' },
  { label: 'Recuperar senha', to: '/recuperar-senha' },
] as const

/**
 * Guia de demonstração para apresentar o produto: cenários copiáveis, atalhos, "modo rápido" e reinício.
 * Só aparece com `?demo` na URL; sem isso a interface é a do produto.
 */
export function DemoGuide() {
  const navigate = useNavigate()
  const [enabled] = useState(isDemoEnabled)
  const [open, setOpen] = useState(false)
  const [fast, setFast] = useState(isFastMode)
  const [copied, setCopied] = useState<string | null>(null)
  const panelId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

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

  if (!enabled) return null

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied((current) => (current === value ? null : current)), 1500)
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
          <h2 id={`${panelId}-title`} ref={headingRef} tabIndex={-1} className={styles.title}>
            Guia de demonstração
          </h2>
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
          <p className={styles.hint}>Google entra e Apple falha. Qualquer outro código é incorreto (3 erros bloqueiam por 15 min).</p>
          <div className={styles.row}>
            {LINKS.map((link) => (
              <button key={link.to} type="button" className={styles.chip} onClick={() => navigate(link.to)}>
                {link.label}
              </button>
            ))}
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" checked={fast} onChange={toggleFast} />
            Modo rápido (respostas em ~0,2 s, reenvio em 3 s)
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
        Demo
      </button>
    </div>
  )
}
