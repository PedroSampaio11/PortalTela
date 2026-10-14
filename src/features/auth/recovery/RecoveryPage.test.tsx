import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MOCK_USER, config, getSession, login, resetLoginMock } from '../mock/authApi'
import { CODE_RULES, recoveryCodeFlow, resendCooldown } from '../mock/codeFlow'
import { timing } from '../timing'
import { RecoveryPage } from './RecoveryPage'

function renderRecovery(state?: { email: string }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/recuperar-senha', state }]}>
      <Routes>
        <Route path="/recuperar-senha" element={<RecoveryPage />} />
        <Route path="/entrar" element={<p>tela de login</p>} />
        <Route path="/" element={<p>tela inicial</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const code = () => screen.getByLabelText('Código de verificação de 6 dígitos')
const verify = () => screen.getByRole('button', { name: 'Verificar código' })

async function goToCodeStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail'), MOCK_USER.email)
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  expect(await screen.findByRole('heading', { name: 'Digite o código de verificação' })).toBeInTheDocument()
}

async function tryCode(user: ReturnType<typeof userEvent.setup>, value: string) {
  await user.click(code())
  await user.keyboard('{Control>}a{/Control}')
  await user.keyboard(value)
  await user.click(verify())
}

describe('RecoveryPage', () => {
  beforeEach(() => {
    config.latency = { min: 0, max: 0 }
    timing.result = 0
    timing.successBar = 0
    timing.redirect = 0
    resendCooldown.seconds = 1
    resetLoginMock()
    recoveryCodeFlow.reset()
  })

  it('etapa 1: botão com cara de desabilitado mostra o que falta; formato inválido é explicado ao sair do campo', async () => {
    const user = userEvent.setup()
    renderRecovery()
    expect(screen.getByRole('heading', { level: 1, name: 'Esqueceu sua senha?' })).toBeInTheDocument()
    expect(screen.getByText('Etapa 1 de 3')).toBeInTheDocument()
    expect(screen.getByText(/o código expira em 10 minutos/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Informe seu e-mail.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('E-mail'), 'ana.souza@')
    await user.tab()
    expect(await screen.findByText('Digite um e-mail válido')).toBeInTheDocument()
  })

  it('o e-mail digitado no login chega preenchido', () => {
    renderRecovery({ email: 'ana.souza@email.com' })
    expect(screen.getByLabelText('E-mail')).toHaveValue('ana.souza@email.com')
  })

  it('o botão voltar da etapa 1 leva ao login', async () => {
    const user = userEvent.setup()
    renderRecovery()
    await user.click(screen.getByRole('link', { name: 'Voltar para o login' }))
    expect(await screen.findByText('tela de login')).toBeInTheDocument()
  })

  it('etapa 2: mostra o e-mail mascarado e o contador de reenvio sem anunciar a cada segundo', async () => {
    const user = userEvent.setup()
    renderRecovery()
    await goToCodeStep(user)
    expect(screen.getByText('Etapa 2 de 3')).toBeInTheDocument()
    expect(screen.getByText('Enviamos um código de 6 dígitos para *****ouza@email.com')).toBeInTheDocument()
    expect(screen.getByText('00:01')).toHaveAttribute('aria-hidden', 'true')
    expect(verify()).toHaveAttribute('aria-disabled', 'true')
    expect(code()).toHaveFocus()
  })

  it('código incorreto conta as tentativas (singular na última) e a 3ª bloqueia tudo', async () => {
    const user = userEvent.setup()
    renderRecovery()
    await goToCodeStep(user)

    await tryCode(user, '111111')
    expect(await screen.findByText('Código incorreto. Você tem mais 2 tentativas.')).toBeInTheDocument()
    expect(code()).toHaveAttribute('aria-invalid', 'true')

    await tryCode(user, '222222')
    expect(await screen.findByText('Código incorreto. Você tem mais 1 tentativa.')).toBeInTheDocument()

    await tryCode(user, '333333')
    expect(await screen.findByText(/Muitas tentativas/)).toBeInTheDocument()
    expect(code()).toBeDisabled()
    expect(verify()).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText(/Você atingiu o limite de reenvios/)).toBeInTheDocument()
    expect(screen.getByText(/Se o e-mail estiver cadastrado/)).toBeInTheDocument()
  })

  it('código expirado avisa e libera o reenvio na hora', async () => {
    const user = userEvent.setup()
    resendCooldown.seconds = 60
    renderRecovery()
    await goToCodeStep(user)
    await tryCode(user, CODE_RULES.expiredCode)
    expect(await screen.findByText('Esse código expirou. Peça um novo.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeInTheDocument()
  })

  it('reenvio: espera, libera, confirma e oferece trocar o e-mail', async () => {
    const user = userEvent.setup()
    renderRecovery()
    await goToCodeStep(user)
    const resend = await screen.findByRole('button', { name: 'Reenviar código' }, { timeout: 3000 })
    await user.click(resend)
    expect(await screen.findByText('Código reenviado. Confira seu e-mail.')).toBeInTheDocument()
    // O botão voltar do topo e o link do reenvio fazem a mesma coisa e têm o mesmo nome (como no Figma).
    const changeEmail = screen.getAllByRole('button', { name: 'Trocar e-mail' })
    expect(changeEmail).toHaveLength(2)
    await user.click(changeEmail[changeEmail.length - 1]!)
    expect(await screen.findByLabelText('E-mail')).toHaveValue(MOCK_USER.email)
  })

  it('jornada completa: código certo, nova senha, tela final e senha nova vale no login', async () => {
    const user = userEvent.setup()
    timing.redirect = 400 // tempo para a tela "Senha atualizada" ser observada antes do redirecionamento
    renderRecovery()
    await goToCodeStep(user)
    await tryCode(user, CODE_RULES.validCode)

    expect(await screen.findByRole('heading', { name: 'Crie uma nova senha' })).toBeInTheDocument()
    expect(screen.getByText('Etapa 3 de 3')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Voltar/ })).not.toBeInTheDocument()

    const password = screen.getByLabelText('Nova senha')
    const confirm = screen.getByLabelText('Confirmar nova senha')
    const submit = screen.getByRole('button', { name: 'Atualizar senha' })
    expect(submit).toHaveAttribute('aria-disabled', 'true')

    await user.type(password, 'ABCDEFGH')
    expect(screen.getByText('Fraca')).toBeInTheDocument()
    expect(screen.getByText('1 número').closest('li')).toHaveTextContent('1 número: pendente')
    expect(screen.getByText('Mínimo de 8 caracteres').closest('li')).toHaveTextContent('Mínimo de 8 caracteres: cumprido')

    await user.clear(password)
    await user.type(password, 'NovaSenha@2026')
    expect(screen.getByText('Forte')).toBeInTheDocument()

    await user.type(confirm, 'NovaSenha@2025')
    await user.tab()
    expect(await screen.findByText('As senhas não são iguais.')).toBeInTheDocument()

    await user.clear(confirm)
    await user.type(confirm, 'NovaSenha@2026')
    await waitFor(() => expect(screen.queryByText('As senhas não são iguais.')).not.toBeInTheDocument())
    await user.click(submit)

    expect(await screen.findByRole('heading', { name: 'Senha atualizada' })).toBeInTheDocument()
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
    expect(getSession()?.email).toBe(MOCK_USER.email)

    // A senha nova passa a valer; a antiga deixa de valer.
    await expect(login({ email: MOCK_USER.email, password: 'NovaSenha@2026', remember: false })).resolves.toMatchObject({ name: 'Ana Souza' })
    await expect(login({ email: MOCK_USER.email, password: MOCK_USER.password, remember: false })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })
})
