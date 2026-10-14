import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MOCK_USER, NETWORK_FAILURE_EMAIL, config, getSession, resetLoginMock } from '../mock/authApi'
import { LoginPage } from './LoginPage'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/entrar']}>
      <Routes>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/" element={<p>tela inicial</p>} />
        <Route path="/recuperar-senha" element={<p>tela de recuperação</p>} />
        <Route path="/cadastro" element={<p>tela de cadastro</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const email = () => screen.getByLabelText('E-mail')
const password = () => screen.getByLabelText('Senha')
const submit = () => screen.getByRole('button', { name: 'Entrar' })

const remember = () => screen.getByRole('checkbox', { name: 'Manter-me conectado' })
const REMEMBER_ERROR = 'Marque "Manter-me conectado" para continuar.'

/** Preenche tudo o que é obrigatório para entrar (e-mail, senha e "Manter-me conectado"). */
async function fill(user: ReturnType<typeof userEvent.setup>, e: string, p: string) {
  await user.type(email(), e)
  await user.type(password(), p)
  await user.click(remember())
}

describe('LoginPage', () => {
  beforeEach(() => {
    config.latency = { min: 0, max: 0 }
    config.socialLatency = 0
    resetLoginMock()
  })

  it('estado padrão: campos vazios, enviar com cara de desabilitado mas focável', () => {
    renderLogin()
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
    expect(email()).toHaveValue('')
    expect(submit()).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Apple/ })).toBeInTheDocument()
  })

  it('clicar em Entrar com o formulário vazio mostra o que falta e foca o primeiro campo', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(submit())
    expect(await screen.findByText('Informe seu e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
    expect(screen.getByText(REMEMBER_ERROR)).toBeInTheDocument()
    expect(email()).toHaveAttribute('aria-invalid', 'true')
    expect(email()).toHaveFocus()
  })

  it('"Manter-me conectado" é obrigatório para entrar: sem marcar o botão não habilita e o erro só aparece ao tentar', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(email(), MOCK_USER.email)
    await user.type(password(), MOCK_USER.password)
    await user.tab() // passa pela caixa sem marcar
    expect(screen.queryByText(REMEMBER_ERROR)).not.toBeInTheDocument()
    expect(submit()).toHaveAttribute('aria-disabled', 'true')

    await user.click(submit())
    expect(await screen.findByText(REMEMBER_ERROR)).toBeInTheDocument()
    expect(remember()).toHaveAttribute('aria-invalid', 'true')
    expect(remember()).toHaveFocus()
    expect(screen.queryByText('tela inicial')).not.toBeInTheDocument()
    expect(getSession()).toBeNull()

    await user.click(remember())
    await waitFor(() => expect(screen.queryByText(REMEMBER_ERROR)).not.toBeInTheDocument())
    expect(submit()).not.toHaveAttribute('aria-disabled')
    await user.click(submit())
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
  })

  it('o login com Google e Apple não depende da caixa', async () => {
    const user = userEvent.setup()
    renderLogin()
    expect(remember()).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: /Google/ }))
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
  })

  it('valida o e-mail ao sair do campo, não a cada tecla', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(email(), 'ana@')
    expect(screen.queryByText(/Digite um e-mail válido/)).not.toBeInTheDocument()
    await user.tab()
    expect(await screen.findByText(/Digite um e-mail válido/)).toBeInTheDocument()
    await user.type(email(), 'email.com')
    await waitFor(() => expect(screen.queryByText(/Digite um e-mail válido/)).not.toBeInTheDocument())
  })

  it('habilita o envio quando e-mail, senha e "Manter-me conectado" estão preenchidos', async () => {
    const user = userEvent.setup()
    renderLogin()
    await fill(user, MOCK_USER.email, 'qualquer')
    await waitFor(() => expect(submit()).not.toHaveAttribute('aria-disabled'))
  })

  it('entra com as credenciais corretas e vai para a tela inicial', async () => {
    const user = userEvent.setup()
    renderLogin()
    await fill(user, MOCK_USER.email, MOCK_USER.password)
    await user.click(submit())
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
    expect(getSession()?.email).toBe(MOCK_USER.email)
  })

  it('credenciais erradas: mensagem geral e os dois campos em erro, sem dizer qual errou', async () => {
    const user = userEvent.setup()
    renderLogin()
    await fill(user, MOCK_USER.email, 'senhaerrada')
    await user.click(submit())
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('E-mail ou senha incorretos. Confira os dados e tente de novo.')
    expect(email()).toHaveAttribute('aria-invalid', 'true')
    expect(password()).toHaveAttribute('aria-invalid', 'true')
    expect(submit()).not.toHaveAttribute('aria-disabled')
  })

  it('3ª tentativa errada bloqueia: campos desabilitados, aviso com o tempo e botão vira Redefinir senha', async () => {
    const user = userEvent.setup()
    renderLogin()
    await fill(user, MOCK_USER.email, 'errada1')
    for (let i = 0; i < 3; i++) {
      await user.click(submit())
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
      if (i < 2) await waitFor(() => expect(submit()).not.toHaveAttribute('aria-busy'))
    }
    const alert = await screen.findByText(/Muitas tentativas/)
    expect(alert).toHaveTextContent('aguarde 15 minutos ou redefina sua senha')
    expect(email()).toBeDisabled()
    expect(password()).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))
    expect(await screen.findByText('tela de recuperação')).toBeInTheDocument()
  })

  it('reabrir a tela durante o bloqueio já mostra o estado Blocked', async () => {
    const user = userEvent.setup()
    const first = renderLogin()
    await fill(user, MOCK_USER.email, 'errada1')
    for (let i = 0; i < 3; i++) {
      await user.click(submit())
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
      if (i < 2) await waitFor(() => expect(submit()).not.toHaveAttribute('aria-busy'))
    }
    first.unmount()
    renderLogin()
    expect(screen.getByText(/Muitas tentativas/)).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeDisabled()
  })

  it('falha de rede mostra mensagem do sistema, sem culpar o usuário nem marcar os campos', async () => {
    const user = userEvent.setup()
    renderLogin()
    await fill(user, NETWORK_FAILURE_EMAIL, 'qualquer')
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos entrar agora')
    expect(email()).not.toHaveAttribute('aria-invalid')
  })

  it('Apple falha com mensagem abaixo dos botões; Google entra', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /Apple/ }))
    expect(await screen.findByText(/Não foi possível conectar/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Google/ }))
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
  })

  it('mostrar e ocultar a senha', async () => {
    const user = userEvent.setup()
    renderLogin()
    expect(password()).toHaveAttribute('type', 'password')
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' })
    await user.click(toggle)
    expect(password()).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(password()).toHaveAttribute('type', 'password')
  })

  it('links de apoio levam aos outros fluxos', async () => {
    const user = userEvent.setup()
    renderLogin()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute(
      'href',
      '/recuperar-senha',
    )
    await user.click(screen.getByRole('link', { name: 'Criar conta' }))
    expect(await screen.findByText('tela de cadastro')).toBeInTheDocument()
  })
})
