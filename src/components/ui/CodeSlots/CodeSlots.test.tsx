import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeSlots } from './CodeSlots'
import type { CodeSlotsProps } from './CodeSlots'

function Harness(props: Partial<CodeSlotsProps> & { initial?: string }) {
  const [value, setValue] = useState(props.initial ?? '')
  return <CodeSlots label="Código" {...props} value={value} onChange={setValue} />
}
const input = () => screen.getByLabelText('Código')

describe('CodeSlots', () => {
  it('aceita só dígitos e limita ao tamanho', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(input(), '12ab34-5678')
    expect(input()).toHaveValue('123456')
  })

  it('colar substitui o valor, ignora o que não é dígito e corta no tamanho', async () => {
    const user = userEvent.setup()
    render(<Harness initial="99" />)
    await user.click(input())
    await user.paste('code 123-456-789')
    expect(input()).toHaveValue('123456')
  })

  it('selecionar tudo e digitar substitui o código', async () => {
    const user = userEvent.setup()
    render(<Harness initial="123457" />)
    await user.click(input())
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('000000')
    expect(input()).toHaveValue('000000')
  })

  it('é um campo único e acessível: input numérico com autocomplete one-time-code', () => {
    render(<Harness />)
    expect(input()).toHaveAttribute('inputmode', 'numeric')
    expect(input()).toHaveAttribute('autocomplete', 'one-time-code')
    expect(input()).toHaveAttribute('maxlength', '6')
  })

  it('erro marca aria-invalid; sucesso deixa o campo somente leitura; disabled desabilita', () => {
    const { rerender } = render(<CodeSlots label="Código" value="123456" onChange={() => {}} status="error" />)
    expect(input()).toHaveAttribute('aria-invalid', 'true')
    rerender(<CodeSlots label="Código" value="123456" onChange={() => {}} status="success" />)
    expect(input()).toHaveAttribute('readonly')
    rerender(<CodeSlots label="Código" value="" onChange={() => {}} disabled />)
    expect(input()).toBeDisabled()
  })
})
