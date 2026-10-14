import { render, screen } from '@testing-library/react'
import { TextField } from './TextField'

describe('TextField helper', () => {
  it('o espaço do helper existe mesmo vazio (a tela não muda de altura) e é a região viva', () => {
    const { container, rerender } = render(<TextField label="E-mail" />)
    const helper = container.querySelector('p[aria-live="polite"]')
    expect(helper).toBeInTheDocument()
    expect(helper).toBeEmptyDOMElement()
    rerender(<TextField label="E-mail" status="error" helperText="Informe seu e-mail." />)
    expect(container.querySelector('p[aria-live="polite"]')).toBe(helper) // o mesmo elemento: nada monta nem desmonta
    expect(screen.getByText('Informe seu e-mail.')).toBeInTheDocument()
  })
})
