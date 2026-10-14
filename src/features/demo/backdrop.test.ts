import { act, renderHook } from '@testing-library/react'
import {
  autoSceneAt,
  getBackdropChoice,
  getBackdropInterval,
  setBackdropChoice,
  setBackdropInterval,
  startAutoBackdrop,
  useActiveScene,
  useBackdropChoice,
} from './backdrop'

describe('backdrop (fundo escolhido na demonstração)', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.history.pushState({}, '', '/')
    setBackdropChoice(null)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sem o modo demonstração a escolha nunca vale, mesmo que exista na sessão', () => {
    window.sessionStorage.setItem('portaltela.demo.bg', 'person-3')
    expect(getBackdropChoice()).toBeNull()
    const { result } = renderHook(() => useActiveScene('/entrar'))
    expect(result.current).toBe('person-4')
  })

  it('guarda a escolha na sessão e volta ao padrão com null', () => {
    window.history.pushState({}, '', '/?demo')
    expect(getBackdropChoice()).toBeNull()
    setBackdropChoice('person-1')
    expect(getBackdropChoice()).toBe('person-1')
    expect(window.sessionStorage.getItem('portaltela.demo.bg')).toBe('person-1')
    setBackdropChoice(null)
    expect(getBackdropChoice()).toBeNull()
    expect(window.sessionStorage.getItem('portaltela.demo.bg')).toBeNull()
  })

  it('ignora um valor inválido guardado na sessão', () => {
    window.history.pushState({}, '', '/?demo')
    window.sessionStorage.setItem('portaltela.demo.bg', 'person-9')
    expect(getBackdropChoice()).toBeNull()
  })

  it('o hook reage à troca (o painel da marca e o guia leem a mesma escolha)', () => {
    window.history.pushState({}, '', '/?demo')
    const { result } = renderHook(() => useBackdropChoice())
    expect(result.current).toBeNull()
    act(() => setBackdropChoice('person-4'))
    expect(result.current).toBe('person-4')
    act(() => setBackdropChoice(null))
    expect(result.current).toBeNull()
  })

  describe('Automático (troca sozinho)', () => {
    it('passa pelas 4 pessoas em ordem, uma a cada intervalo, e dá a volta', () => {
      const t0 = 1_000_000
      const scene = (seconds: number) => autoSceneAt(1, t0, 10, t0 + seconds * 1000)
      expect(scene(0)).toBe('person-2')
      expect(scene(9.9)).toBe('person-2')
      expect(scene(10)).toBe('person-3')
      expect(scene(20)).toBe('person-4')
      expect(scene(30)).toBe('person-1')
      expect(scene(40)).toBe('person-2')
      // Relógio atrasado em relação ao início nunca volta para trás.
      expect(autoSceneAt(1, t0, 10, t0 - 5000)).toBe('person-2')
    })

    it('começa pela cena que está na tela e o intervalo padrão é 10 s', () => {
      window.history.pushState({}, '', '/?demo')
      expect(getBackdropInterval()).toBe(10)
      vi.useFakeTimers({ now: 5_000_000 })
      startAutoBackdrop('person-3')
      expect(getBackdropChoice()).toBe('auto')
      const { result } = renderHook(() => useActiveScene('/entrar'))
      expect(result.current).toBe('person-3')
    })

    it('troca a cada intervalo, em qualquer tela, e Padrão/fixa param o rodízio', () => {
      window.history.pushState({}, '', '/?demo')
      vi.useFakeTimers({ now: 5_000_000 })
      startAutoBackdrop('person-4')
      const { result } = renderHook(() => useActiveScene('/cadastro'))
      expect(result.current).toBe('person-4')
      act(() => void vi.advanceTimersByTime(10_000))
      expect(result.current).toBe('person-1')
      act(() => void vi.advanceTimersByTime(10_000))
      expect(result.current).toBe('person-2')

      act(() => setBackdropChoice('person-3'))
      act(() => void vi.advanceTimersByTime(30_000))
      expect(result.current).toBe('person-3')
      act(() => setBackdropChoice(null))
      expect(result.current).toBe('person-2') // Cadastro: a cena padrão
    })

    it('mudar o intervalo recomeça da cena de agora, sem pulo', () => {
      window.history.pushState({}, '', '/?demo')
      vi.useFakeTimers({ now: 5_000_000 })
      startAutoBackdrop('person-1')
      const { result } = renderHook(() => useActiveScene('/entrar'))
      act(() => void vi.advanceTimersByTime(10_000))
      expect(result.current).toBe('person-2')
      act(() => setBackdropInterval(5))
      expect(getBackdropInterval()).toBe(5)
      expect(result.current).toBe('person-2')
      act(() => void vi.advanceTimersByTime(5_000))
      expect(result.current).toBe('person-3')
    })

    it('ignora um intervalo inválido guardado na sessão', () => {
      window.sessionStorage.setItem('portaltela.demo.bg.every', '1')
      expect(getBackdropInterval()).toBe(10)
    })
  })
})
