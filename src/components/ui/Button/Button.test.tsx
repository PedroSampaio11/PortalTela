import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('dispara onClick quando ativo', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Entrar</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disabled usa aria-disabled, segue focável e chama onDisabledClick em vez de onClick', async () => {
    const onClick = vi.fn()
    const onDisabledClick = vi.fn()
    render(
      <Button disabled onClick={onClick} onDisabledClick={onDisabledClick}>
        Entrar
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Entrar' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()
    button.focus()
    expect(button).toHaveFocus()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(onDisabledClick).toHaveBeenCalledOnce()
  })

  it('loading é aria-busy e ignora cliques', async () => {
    const onClick = vi.fn()
    const onDisabledClick = vi.fn()
    render(
      <Button loading onClick={onClick} onDisabledClick={onDisabledClick}>
        Entrar
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Entrar' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(onDisabledClick).not.toHaveBeenCalled()
  })
})
