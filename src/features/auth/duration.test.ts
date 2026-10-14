import { formatWait } from './duration'

describe('formatWait', () => {
  it('arredonda para cima em minutos inteiros', () => {
    expect(formatWait(15 * 60_000)).toBe('15 minutos')
    expect(formatWait(14 * 60_000 + 1)).toBe('15 minutos')
    expect(formatWait(2 * 60_000)).toBe('2 minutos')
  })

  it('usa "menos de 1 minuto" no último minuto, sem "1 minutos"', () => {
    expect(formatWait(60_000)).toBe('menos de 1 minuto')
    expect(formatWait(30_000)).toBe('menos de 1 minuto')
    expect(formatWait(0)).toBe('menos de 1 minuto')
  })
})
