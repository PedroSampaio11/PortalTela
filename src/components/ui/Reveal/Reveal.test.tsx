import { act, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { InlineMessageSlot } from '../InlineMessage'
import { Reveal } from './Reveal'

function Toggle({ initial = false }: { initial?: boolean }) {
  const [open, setOpen] = useState(initial)
  return (
    <>
      <button onClick={() => setOpen((v) => !v)}>alternar</button>
      <Reveal open={open}>
        <p>conteúdo</p>
      </Reveal>
    </>
  )
}

describe('Reveal', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('não ocupa lugar nenhum no DOM enquanto fechado', () => {
    render(<Toggle />)
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()
  })

  it('monta ao abrir e só desmonta depois da animação de saída', () => {
    render(<Toggle />)
    act(() => screen.getByText('alternar').click())
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(50)
    })
    act(() => screen.getByText('alternar').click())
    expect(screen.getByText('conteúdo')).toBeInTheDocument() // ainda animando a saída
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()
  })

  it('abrir de novo durante a saída cancela a desmontagem', () => {
    render(<Toggle initial />)
    act(() => screen.getByText('alternar').click()) // fecha
    act(() => {
      vi.advanceTimersByTime(100)
    })
    act(() => screen.getByText('alternar').click()) // reabre
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })
})

describe('InlineMessageSlot', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('mantém o texto enquanto sai, para a mensagem não "piscar" vazia', () => {
    const { rerender } = render(<InlineMessageSlot message="Código incorreto." hasIcon />)
    expect(screen.getByRole('alert')).toHaveTextContent('Código incorreto.')
    rerender(<InlineMessageSlot message={null} hasIcon />)
    expect(screen.getByRole('alert')).toHaveTextContent('Código incorreto.')
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('troca o texto sem fechar quando a mensagem muda', () => {
    const { rerender } = render(<InlineMessageSlot message="Mais 2 tentativas." />)
    rerender(<InlineMessageSlot message="Mais 1 tentativa." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Mais 1 tentativa.')
  })
})
