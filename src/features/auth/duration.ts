/** "15 minutos", "menos de 1 minuto" (pluralização em pt-BR, sem concatenação solta). */
export function formatWait(ms: number): string {
  if (ms <= 60_000) return 'menos de 1 minuto'
  const minutes = Math.ceil(ms / 60_000)
  return `${minutes} minutos`
}
