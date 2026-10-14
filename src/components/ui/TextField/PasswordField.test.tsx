import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CAPS_LOCK_MESSAGE, PASTE_BLOCKED_MESSAGE, PasswordField } from './PasswordField'

describe('PasswordField', () => {
  it('avisa quando o Caps Lock está ligado e some ao desligar ou sair do campo', () => {
    render(<PasswordField label="Senha" />)
    const input = screen.getByLabelText('Senha', { selector: 'input' })
    fireEvent.keyDown(input, { key: 'A', modifierCapsLock: true })
    expect(screen.getByText(CAPS_LOCK_MESSAGE)).toBeInTheDocument()
    fireEvent.keyUp(input, { key: 'CapsLock', modifierCapsLock: false })
    expect(screen.queryByText(CAPS_LOCK_MESSAGE)).not.toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'A', modifierCapsLock: true })
    fireEvent.blur(input)
    expect(screen.queryByText(CAPS_LOCK_MESSAGE)).not.toBeInTheDocument()
  })

  it('o erro de validação tem prioridade sobre o aviso de Caps Lock', () => {
    render(<PasswordField label="Senha" status="error" helperText="Informe sua senha." />)
    fireEvent.keyDown(screen.getByLabelText('Senha', { selector: 'input' }), { key: 'A', modifierCapsLock: true })
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
    expect(screen.queryByText(CAPS_LOCK_MESSAGE)).not.toBeInTheDocument()
  })

  it('com blockClipboard, colar/copiar/recortar são bloqueados e digitar continua funcionando', async () => {
    const user = userEvent.setup()
    render(<PasswordField label="Senha" blockClipboard />)
    const input = screen.getByLabelText('Senha', { selector: 'input' }) as HTMLInputElement

    expect(fireEvent.paste(input, { clipboardData: { getData: () => 'Colada@123' } })).toBe(false) // preventDefault
    expect(fireEvent.copy(input)).toBe(false)
    expect(fireEvent.cut(input)).toBe(false)
    expect(screen.getByText(PASTE_BLOCKED_MESSAGE)).toBeInTheDocument()

    await user.type(input, 'Digitada@1')
    expect(input.value).toBe('Digitada@1')
    expect(screen.queryByText(PASTE_BLOCKED_MESSAGE)).not.toBeInTheDocument()
  })

  it('sem blockClipboard (login), colar é permitido', () => {
    render(<PasswordField label="Senha" />)
    expect(fireEvent.paste(screen.getByLabelText('Senha', { selector: 'input' }), { clipboardData: { getData: () => 'x' } })).toBe(true)
  })
})
