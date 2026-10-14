import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MOCK_USER, config, getSession, login, resetLoginMock } from '@/features/auth/mock/authApi'
import { CODE_RULES, resendCooldown, signupCodeFlow } from '@/features/auth/mock/codeFlow'
import { getBackdropChoice, setBackdropChoice } from './backdrop'
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
    setBackdropChoice(null)
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

  it('escolhe o fundo da tela (Pessoa 1 a 4) e volta ao padrão; cada opção tem a sua prévia', async () => {
    window.history.pushState({}, '', '/?demo')
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'Demo' }))
    const group = screen.getByRole('group', { name: 'Fundo da tela' })
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(['Padrão', 'Automático', 'Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4'])
    // Toda opção mostra a imagem (Automático mostra as 4 juntas): é a prévia do que o clique faz.
    expect(buttons.map((button) => button.querySelectorAll('img').length / 2)).toEqual([1, 4, 1, 1, 1, 1])
    expect(within(group).getByRole('button', { name: 'Padrão' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(group).getByRole('button', { name: 'Pessoa 3' }))
    expect(getBackdropChoice()).toBe('person-3')
    expect(within(group).getByRole('button', { name: 'Pessoa 3' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(group).getByRole('button', { name: 'Padrão' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(within(group).getByRole('button', { name: 'Padrão' }))
    expect(getBackdropChoice()).toBeNull()
    expect(within(group).getByRole('button', { name: 'Padrão' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('Automático troca sozinho: escolhe o intervalo (5, 10 ou 20 s) e marca a pessoa de agora', async () => {
    window.history.pushState({}, '', '/?demo')
    const user = userEvent.setup()
    renderGuide()
    await user.click(screen.getByRole('button', { name: 'Demo' }))
    const group = screen.getByRole('group', { name: 'Fundo da tela' })
    expect(screen.queryByRole('group', { name: 'Trocar a cada' })).not.toBeInTheDocument()

    await user.click(within(group).getByRole('button', { name: 'Automático' }))
    expect(getBackdropChoice()).toBe('auto')
    expect(within(group).getByRole('button', { name: 'Automático' })).toHaveAttribute('aria-pressed', 'true')
    // Começa pela cena de agora (nesta rota, a Person 4) e a marca como a que está na tela.
    expect(within(group).getByRole('button', { name: 'Pessoa 4' })).toHaveAttribute('aria-current', 'true')

    const every = screen.getByRole('group', { name: 'Trocar a cada' })
    expect(within(every).getAllByRole('button').map((button) => button.textContent)).toEqual(['5 s', '10 s', '20 s'])
    expect(within(every).getByRole('button', { name: '10 s' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(every).getByRole('button', { name: '5 s' }))
    expect(within(every).getByRole('button', { name: '5 s' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(every).getByRole('button', { name: '10 s' })).toHaveAttribute('aria-pressed', 'false')

    // Fixar uma pessoa encerra o rodízio e esconde o intervalo.
    await user.click(within(group).getByRole('button', { name: 'Pessoa 2' }))
    expect(screen.queryByRole('group', { name: 'Trocar a cada' })).not.toBeInTheDocument()
  })

  it('arrasta o guia pela alça, guarda a posição na sessão e duplo clique devolve ao canto', async () => {
    window.history.pushState({}, '', '/?demo')
    renderGuide()
    const grip = screen.getByRole('button', { name: 'Mover guia' })
    const root = grip.closest('div[class*="root"]') as HTMLElement
    expect(root.style.left).toBe('')

    fireEvent.pointerDown(grip, { button: 0, clientX: 20, clientY: 20, pointerId: 1 })
    fireEvent.pointerMove(grip, { clientX: 220, clientY: 120, pointerId: 1 })
    fireEvent.pointerUp(grip, { pointerId: 1 })
    expect(root.style.left).toBe('200px')
    expect(root.style.top).toBe('100px')
    expect(window.sessionStorage.getItem('portaltela.demo.pos')).toBe('{"left":200,"top":100}')

    fireEvent.doubleClick(grip)
    expect(root.style.left).toBe('')
    expect(window.sessionStorage.getItem('portaltela.demo.pos')).toBeNull()
  })

  it('o guia nunca sai da janela ao arrastar', () => {
    window.history.pushState({}, '', '/?demo')
    renderGuide()
    const grip = screen.getByRole('button', { name: 'Mover guia' })
    const root = grip.closest('div[class*="root"]') as HTMLElement
    fireEvent.pointerDown(grip, { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(grip, { clientX: -500, clientY: -500, pointerId: 1 })
    fireEvent.pointerUp(grip, { pointerId: 1 })
    expect(root.style.left).toBe('0px')
    expect(root.style.top).toBe('0px')
  })

  it('a alça também move por teclado (setas; Shift mais rápido; Home volta) e não rouba o Alt + setas', async () => {
    window.history.pushState({}, '', '/?demo')
    const user = userEvent.setup()
    renderGuide()
    const grip = screen.getByRole('button', { name: 'Mover guia' })
    const root = grip.closest('div[class*="root"]') as HTMLElement
    grip.focus()
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect([root.style.left, root.style.top]).toEqual(['16px', '16px'])
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(root.style.left).toBe('80px')
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}')
    expect(root.style.left).toBe('80px')
    await user.keyboard('{Home}')
    expect(root.style.left).toBe('')
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
