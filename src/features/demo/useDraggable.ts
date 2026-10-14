import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, RefObject } from 'react'

const POSITION_KEY = 'portaltela.demo.pos'
const KEY_STEP = 16
const KEY_STEP_LARGE = 64

export interface Position {
  left: number
  top: number
}

function readPosition(): Position | null {
  try {
    const raw = window.sessionStorage.getItem(POSITION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<Position>
    return Number.isFinite(value.left) && Number.isFinite(value.top) ? { left: value.left!, top: value.top! } : null
  } catch {
    return null
  }
}

function writePosition(position: Position | null) {
  try {
    if (position) window.sessionStorage.setItem(POSITION_KEY, JSON.stringify(position))
    else window.sessionStorage.removeItem(POSITION_KEY)
  } catch {
    /* sem storage: a posição vale até recarregar */
  }
}

/**
 * Deixa o guia flutuante arrastável para ele nunca tampar o que se quer mostrar (`active`: o guia está na tela).
 * Quem usa liga `handleProps` em qualquer área de "pegar" (o cabeçalho do painel) e `gripProps` na alça, que
 * também funciona por teclado
 * (setas movem 16 px, Shift + setas 64 px, Home ou duplo clique devolvem ao canto). A posição fica na sessão e
 * sempre é mantida inteira dentro da janela, inclusive quando o painel abre ou a janela muda de tamanho.
 */
export function useDraggable(rootRef: RefObject<HTMLElement | null>, active: boolean) {
  const [position, setPosition] = useState<Position | null>(readPosition)
  const latest = useRef(position)
  const grab = useRef<{ dx: number; dy: number } | null>(null)

  const apply = useCallback((next: Position | null) => {
    latest.current = next
    setPosition(next)
  }, [])

  const clamp = useCallback(
    (point: Position): Position => {
      const root = rootRef.current
      const width = root?.offsetWidth ?? 0
      const height = root?.offsetHeight ?? 0
      return {
        left: Math.round(Math.min(Math.max(0, point.left), Math.max(0, window.innerWidth - width))),
        top: Math.round(Math.min(Math.max(0, point.top), Math.max(0, window.innerHeight - height))),
      }
    },
    [rootRef],
  )

  // Mantém o guia inteiro na janela: ao abrir o painel (cresce), ao redimensionar e ao restaurar uma posição antiga.
  useEffect(() => {
    const root = rootRef.current
    const keepInside = () => {
      const current = latest.current
      if (!current) return
      const next = clamp(current)
      if (next.left !== current.left || next.top !== current.top) {
        apply(next)
        writePosition(next)
      }
    }
    keepInside()
    window.addEventListener('resize', keepInside)
    const observer = typeof ResizeObserver === 'undefined' || !root ? null : new ResizeObserver(keepInside)
    if (root) observer?.observe(root)
    return () => {
      window.removeEventListener('resize', keepInside)
      observer?.disconnect()
    }
  }, [active, apply, clamp, rootRef])

  const currentPoint = useCallback((): Position => {
    const rect = rootRef.current?.getBoundingClientRect()
    return latest.current ?? { left: rect?.left ?? 0, top: rect?.top ?? 0 }
  }, [rootRef])

  const handleProps = {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.button !== 0) return
      // Botões do cabeçalho (ocultar, minimizar) continuam sendo botões; só a alça (data-grip) arrasta.
      const control = (event.target as HTMLElement).closest('button')
      if (control && !control.hasAttribute('data-grip')) return
      const point = currentPoint()
      grab.current = { dx: event.clientX - point.left, dy: event.clientY - point.top }
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const held = grab.current
      if (!held) return
      apply(clamp({ left: event.clientX - held.dx, top: event.clientY - held.dy }))
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      if (!grab.current) return
      grab.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
      writePosition(latest.current)
    },
    onPointerCancel() {
      grab.current = null
      writePosition(latest.current)
    },
  }

  const reset = useCallback(() => {
    apply(null)
    writePosition(null)
  }, [apply])

  const gripProps = {
    ...handleProps,
    onDoubleClick: reset,
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      // Alt + setas é o atalho de navegar pelos estados; não pode mover o guia junto.
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === 'Home') {
        event.preventDefault()
        reset()
        return
      }
      const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP
      const delta: Partial<Record<string, Position>> = {
        ArrowLeft: { left: -step, top: 0 },
        ArrowRight: { left: step, top: 0 },
        ArrowUp: { left: 0, top: -step },
        ArrowDown: { left: 0, top: step },
      }
      const move = delta[event.key]
      if (!move) return
      event.preventDefault()
      const from = currentPoint()
      const next = clamp({ left: from.left + move.left, top: from.top + move.top })
      apply(next)
      writePosition(next)
    },
  }

  return { position, handleProps, gripProps }
}
