import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MOCK_USER, config, getSession, login, resetLoginMock } from '../mock/authApi'
import { CODE_RULES, resendCooldown, signupCodeFlow } from '../mock/codeFlow'
import { timing } from '../timing'
import { SignUpPage } from './SignUpPage'

function renderSignUp() {
  return render(
    <MemoryRouter initialEntries={['/cadastro']}>
      <Routes>
        <Route path="/cadastro" element={<SignUpPage />} />
        <Route path="/entrar" element={<p>tela de login</p>} />
        <Route path="/" element={<p>tela inicial</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

type User = ReturnType<typeof userEvent.setup>
const code = () => screen.getByLabelText('Código de verificação de 6 dígitos')

async function fillDetails(user: User, name = 'Ana Souza', email = 'nova.pessoa@email.com') {
  await user.type(screen.getByLabelText('Nome completo'), name)
  await user.type(screen.getByLabelText('E-mail'), email)
  await user.click(screen.getByRole('checkbox'))
}

async function toCodeStep(user: User, email?: string) {
  await fillDetails(user, 'Ana Souza', email)
  await user.click(screen.getByRole('button', { name: /^Continuar$/ }))
  expect(await screen.findByRole('heading', { name: 'Digite o código de verificação' })).toBeInTheDocument()
}

async function tryCode(user: User, value: string) {
  await user.click(code())
  await user.keyboard('{Control>}a{/Control}')
  await user.keyboard(value)
  await user.click(screen.getByRole('button', { name: 'Verificar código' }))
}

async function createPassword(user: User, password: string) {
  await user.type(screen.getByLabelText('Senha', { exact: true }), password)
  await user.type(screen.getByLabelText('Confirmar senha'), password)
  await user.click(screen.getByRole('button', { name: 'Criar conta' }))
}

describe('SignUpPage', () => {
  beforeEach(() => {
    config.latency = { min: 0, max: 0 }
    config.socialLatency = 0
    timing.result = 0
    timing.successBar = 0
    timing.redirect = 0
    resendCooldown.seconds = 60
    resetLoginMock()
    signupCodeFlow.reset()
  })

  it('etapa 1: estado padrão com botão com cara de desabilitado, termos com links e convite para entrar', () => {
    renderSignUp()
    expect(screen.getByRole('heading', { level: 1, name: 'Crie sua conta' })).toBeInTheDocument()
    expect(screen.getByText('Etapa 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Continuar$/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('link', { name: 'termos de uso' })).toHaveAttribute('href', '/termos')
    expect(screen.getByRole('link', { name: 'política de privacidade' })).toHaveAttribute('href', '/privacidade')
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar')
  })

  it('clicar em Continuar vazio mostra todos os erros de uma vez e foca o primeiro campo', async () => {
    const user = userEvent.setup()
    renderSignUp()
    await user.click(screen.getByRole('button', { name: /^Continuar$/ }))
    expect(await screen.findByText('Informe nome e sobrenome.')).toBeInTheDocument()
    expect(screen.getByText('Digite um e-mail válido, como nome@email.com.')).toBeInTheDocument()
    expect(screen.getByText('Aceite os termos para continuar.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveFocus()
  })

  it('o aviso dos termos só aparece depois de tentar enviar, não ao passar o teclado pela caixa', async () => {
    const user = userEvent.setup()
    renderSignUp()
    await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
    await user.tab()
    await user.tab()
    await user.tab() // passa pelo checkbox sem marcar
    expect(screen.queryByText('Aceite os termos para continuar.')).not.toBeInTheDocument()
  })

  it('nome precisa de sobrenome; o erro de cada campo aparece ao sair dele', async () => {
    const user = userEvent.setup()
    renderSignUp()
    await user.type(screen.getByLabelText('Nome completo'), 'Ana')
    await user.tab()
    expect(await screen.findByText('Informe nome e sobrenome.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nome completo'), ' Souza')
    await waitFor(() => expect(screen.queryByText('Informe nome e sobrenome.')).not.toBeInTheDocument())
  })

  it('clicar no texto do aceite marca a caixa', async () => {
    const user = userEvent.setup()
    renderSignUp()
    const checkbox = screen.getByRole('checkbox')
    await user.click(screen.getByText(/Li e aceito os/))
    expect(checkbox).toBeChecked()
    // Clicar nos links sem marcar é coberto no teste de navegador real (o jsdom não segue a regra do label).
  })

  it('jornada completa: cria a conta, entra e a conta nova passa a existir no login', async () => {
    const user = userEvent.setup()
    renderSignUp()
    await toCodeStep(user)
    expect(screen.getByText('Etapa 2 de 3')).toBeInTheDocument()
    expect(screen.getByText('Enviamos um código de 6 dígitos para *******ssoa@email.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument()

    await tryCode(user, CODE_RULES.validCode)
    expect(await screen.findByRole('heading', { name: 'Crie sua senha' })).toBeInTheDocument()
    expect(screen.getByText('Etapa 3 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toHaveAttribute('aria-disabled', 'true')

    await createPassword(user, 'Cadastro@2026')
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
    expect(getSession()).toMatchObject({ name: 'Ana Souza', email: 'nova.pessoa@email.com' })
    await expect(login({ email: 'nova.pessoa@email.com', password: 'Cadastro@2026', remember: false })).resolves.toMatchObject({ name: 'Ana Souza' })
  })

  it('etapa do código no cadastro: 3 erros bloqueiam e o e-mail continua visível (Flow=SignUp)', async () => {
    const user = userEvent.setup()
    renderSignUp()
    await toCodeStep(user)
    for (const attempt of ['111111', '222222', '333333']) await tryCode(user, attempt)
    expect(await screen.findByText(/Muitas tentativas/)).toBeInTheDocument()
    expect(screen.getByText(/Enviamos um código de 6 dígitos para/)).toBeInTheDocument()
    expect(code()).toBeDisabled()
  })

  it('o botão mostra "Verificando" enquanto confere o código', async () => {
    const user = userEvent.setup()
    renderSignUp()
    await toCodeStep(user)
    config.latency = { min: 200, max: 200 }
    await tryCode(user, '111111')
    expect(await screen.findByRole('button', { name: 'Verificando' })).toHaveAttribute('aria-busy', 'true')
  })

  it('nunca revela que o e-mail já existe e nunca altera a conta existente', async () => {
    const user = userEvent.setup()
    renderSignUp()
    // Usa o e-mail da conta de demonstração: o fluxo segue como se fosse novo.
    await toCodeStep(user, MOCK_USER.email)
    expect(screen.queryByText(/e-mail já|já existe|já está cadastrad/i)).not.toBeInTheDocument()
    await tryCode(user, CODE_RULES.validCode)
    await screen.findByRole('heading', { name: 'Crie sua senha' })
    await createPassword(user, 'Outra@Senha1')
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
    // A senha da conta existente continua a mesma.
    await expect(login({ email: MOCK_USER.email, password: MOCK_USER.password, remember: false })).resolves.toBeTruthy()
    await expect(login({ email: MOCK_USER.email, password: 'Outra@Senha1', remember: false })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  it('trocar e-mail volta à etapa 1 com o que foi preenchido', async () => {
    const user = userEvent.setup()
    renderSignUp()
    await toCodeStep(user)
    await user.click(screen.getByRole('button', { name: 'Trocar e-mail' }))
    expect(await screen.findByLabelText('Nome completo')).toHaveValue('Ana Souza')
    expect(within(screen.getByRole('main')).getByLabelText('E-mail')).toHaveValue('nova.pessoa@email.com')
  })
})
