import { useSyncExternalStore } from 'react'
import { useNow } from '@/hooks/useNow'
import { SCENE_IDS, isSceneId, sceneForPath } from '@/features/auth/scenes'
import type { SceneId } from '@/features/auth/scenes'
import { isDemoEnabled } from './demoMode'

const CHOICE_KEY = 'portaltela.demo.bg'
const EVERY_KEY = 'portaltela.demo.bg.every'
const AUTO_KEY = 'portaltela.demo.bg.auto'

/** Intervalos do modo Automático, em segundos. */
export const BACKDROP_INTERVALS = [5, 10, 20] as const
export const DEFAULT_BACKDROP_INTERVAL = 10

/** `null` = Padrão (cada tela usa o seu fundo); `'auto'` = troca sozinho; ou uma das 4 pessoas, fixa. */
export type BackdropChoice = SceneId | 'auto' | null

const listeners = new Set<() => void>()
/** Sem sessionStorage (modo privado restrito), a escolha vale até recarregar. */
const memory = new Map<string, string>()

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return memory.get(key) ?? null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key)
    else window.sessionStorage.setItem(key, value)
  } catch {
    if (value === null) memory.delete(key)
    else memory.set(key, value)
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

/** Escolha feita no guia. Só existe com o modo demonstração ligado. */
export function getBackdropChoice(): BackdropChoice {
  if (!isDemoEnabled()) return null
  const value = read(CHOICE_KEY)
  if (value === 'auto') return 'auto'
  return isSceneId(value) ? value : null
}

export function getBackdropInterval(): number {
  const value = Number(read(EVERY_KEY))
  return (BACKDROP_INTERVALS as readonly number[]).includes(value) ? value : DEFAULT_BACKDROP_INTERVAL
}

/** Onde o rodízio começou: índice da cena e o instante (ms). A cena de agora sai só disso e do relógio. */
function readAuto(): { start: number; since: number } {
  try {
    const value = JSON.parse(read(AUTO_KEY) ?? '') as { start?: unknown; since?: unknown }
    if (typeof value.start === 'number' && typeof value.since === 'number') return { start: value.start, since: value.since }
  } catch {
    /* sem ponto de partida válido: começa da primeira */
  }
  return { start: 0, since: 0 }
}

/** Cena do rodízio num instante: avança uma a cada `everySeconds`, em ordem (Person 1, 2, 3, 4, 1...). */
export function autoSceneAt(start: number, since: number, everySeconds: number, now: number): SceneId {
  const steps = Math.max(0, Math.floor((now - since) / (everySeconds * 1000)))
  return SCENE_IDS[(start + steps) % SCENE_IDS.length]!
}

/** Fixa uma pessoa (ou `null` volta ao Padrão). */
export function setBackdropChoice(choice: SceneId | null): void {
  write(CHOICE_KEY, choice)
  notify()
}

/** Liga o rodízio a partir da cena que está na tela, sem pulo. */
export function startAutoBackdrop(from: SceneId, now: number = Date.now()): void {
  write(AUTO_KEY, JSON.stringify({ start: SCENE_IDS.indexOf(from), since: now }))
  write(CHOICE_KEY, 'auto')
  notify()
}

/** Muda o intervalo do rodízio; se ele está ligado, recomeça da cena de agora (sem pulo). */
export function setBackdropInterval(seconds: number, now: number = Date.now()): void {
  const previous = getBackdropInterval()
  if (seconds === previous) return
  if (getBackdropChoice() === 'auto') {
    const auto = readAuto()
    const current = autoSceneAt(auto.start, auto.since, previous, now)
    write(AUTO_KEY, JSON.stringify({ start: SCENE_IDS.indexOf(current), since: now }))
  }
  write(EVERY_KEY, String(seconds))
  notify()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Escolha do guia, reativa: o painel da marca e o guia leem a mesma. */
export function useBackdropChoice(): BackdropChoice {
  return useSyncExternalStore(subscribe, getBackdropChoice, () => null)
}

export function useBackdropInterval(): number {
  return useSyncExternalStore(subscribe, getBackdropInterval, () => DEFAULT_BACKDROP_INTERVAL)
}

/**
 * A cena que está na tela agora: a escolhida no guia, a do rodízio ou a padrão da rota. O rodízio é calculado
 * pelo relógio (não por um contador de cada componente), então o painel da marca e o guia mostram sempre a mesma.
 * O relógio só anda (a cada segundo) enquanto o Automático está ligado.
 */
export function useActiveScene(pathname: string): SceneId {
  const choice = useBackdropChoice()
  const every = useBackdropInterval()
  const now = useNow(choice === 'auto')
  if (choice !== 'auto') return sceneForPath(pathname, choice)
  const { start, since } = readAuto()
  return autoSceneAt(start, since, every, now)
}
