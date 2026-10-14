import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MOCK_USER, config, getSession, login, resetLoginMock } from '@/features/auth/mock/authApi'
import { CODE_RULES, resendCooldown, signupCodeFlow } from '@/features/auth/mock/codeFlow'
import { DemoGuide } from './DemoGuide'
import { setFastMode } from './demoMode'

function renderGuide() {
  return render(
    <MemoryRouter>
      <DemoGuide />
    </MemoryRouter>,
  )
}

describe('DemoGuide', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.history.pushState({}, '', '/')
    setFastMode(false)
    resetLoginMock()
  })

  it('não aparece sem ?demo: a interface padrão fica limpa', () => {
    renderGuide()
    expect(screen.queryByRole('button', { name: 'Demo' })).not.toBeInTheDocument()
  })

  it('aparece com ?demo, abre com os cenários e fecha com Esc devolvendo o foco', async () => {
    window.history.pushState({}, '', '/?demo')
    const user = userEvent.setup()
    renderGuide()
    const trigger = screen.getByRole('button', { name: 'Demo' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = screen.getByRole('region', { name: 'Guia de demonstração' })
    expect(panel).toHaveTextContent(MOCK_USER.email)
    expect(panel).toHaveTextContent(MOCK_USER.password)
    expect(panel).toHaveTextContent(CODE_RULES.validCode)
    expect(panel).toHaveTextContent(CODE_RULES.expiredCode)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Guia de demonstração' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('fica ligado na sessão depois que a URL perde o ?demo', () => {
    window.history.pushState({}, '', '/?demo')
    const first = renderGuide()
    first.unmount()
    window.history.pushState({}, '', '/entrar')
    renderGuide()
    expect(screen.getByRole('button', { name: 'Demo' })).toBeInTheDocument()
  })

  it('com o painel recolhido sobra uma barra compacta com anterior, passeio e próximo', async () => {
    window.history.pushState({}, '', '/?demo&state=login.blocked')
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/?demo&state=login.blocked']}>
        <DemoGuide />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('region', { name: 'Guia de demonstração' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Estado anterior' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo estado' })).toBeInTheDocument()
    const tour = screen.getByRole('button', { name: 'Passeio: iniciar' })
    await user.click(tour)
    expect(screen.getByRole('button', { name: 'Passeio: pausar' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('iniciar o passeio recolhe o painel; ocultar some com tudo e Alt+D traz de volta', async () => {
    window.history.pushState({}, '', '/?demo')
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: /^Demo/ }))
    await user.click(screen.getByRole('button', { name: 'Passeio automático' }))
    expect(screen.queryByRole('region', { name: 'Guia de demonstração' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ocultar guia' }))
    expect(screen.queryByRole('button', { name: /^Demo/ })).not.toBeInTheDocument()
    await user.keyboard('{Alt>}d{/Alt}')
    expect(screen.getByRole('button', { name: /^Demo/ })).toBeInTheDocument()
  })

  it('modo rápido encurta latência e reenvio; desligar volta ao normal', async () => {
    window.history.pushState({}, '', '/?demo')
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'Demo' }))
    await user.click(screen.getByRole('checkbox', { name: /Modo rápido/ }))
    expect(resendCooldown.seconds).toBe(3)
    expect(config.latency.max).toBeLessThan(500)
    await user.click(screen.getByRole('checkbox', { name: /Modo rápido/ }))
    expect(resendCooldown.seconds).toBe(30)
    expect(config.latency.max).toBeGreaterThan(1000)
  })

  it('reiniciar zera bloqueios, contas e sessão', async () => {
    window.history.pushState({}, '', '/?demo')
    config.latency = { min: 0, max: 0 }
    const reload = vi.fn()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload, search: '?demo' }, writable: true })
    for (let i = 0; i < 3; i++) await login({ email: MOCK_USER.email, password: 'errada', remember: false }).catch(() => undefined)
    await expect(login({ email: MOCK_USER.email, password: MOCK_USER.password, remember: false })).rejects.toMatchObject({ code: 'LOCKED' })
    signupCodeFlow.reset()

    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'Demo' }))
    await user.click(screen.getByRole('button', { name: 'Reiniciar demonstração' }))
    expect(reload).toHaveBeenCalled()
    await expect(login({ email: MOCK_USER.email, password: MOCK_USER.password, remember: false })).resolves.toBeTruthy()
    expect(getSession()).not.toBeNull()
  })
})
