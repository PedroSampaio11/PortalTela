/** Requisitos de senha do DS (PasswordRequirements). A ordem é a do Figma. */
export interface PasswordRequirement {
  id: 'length' | 'upper' | 'number' | 'lower' | 'special'
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_REQUIREMENTS: readonly PasswordRequirement[] = [
  { id: 'length', label: 'Mínimo de 8 caracteres', test: (p) => p.length >= 8 },
  { id: 'upper', label: '1 letra maiúscula', test: (p) => /\p{Lu}/u.test(p) },
  { id: 'number', label: '1 número', test: (p) => /\p{N}/u.test(p) },
  { id: 'lower', label: '1 letra minúscula', test: (p) => /\p{Ll}/u.test(p) },
  { id: 'special', label: '1 caractere especial', test: (p) => /[^\p{L}\p{N}\s]/u.test(p) },
]

export type StrengthLevel = 'none' | 'weak' | 'fair' | 'good' | 'strong'

/** Regra do DS: 0 cumpridos é None, 1 ou 2 é Weak, 3 é Fair, 4 é Good, 5 é Strong. */
export function strengthLevel(metCount: number): StrengthLevel {
  if (metCount <= 0) return 'none'
  if (metCount <= 2) return 'weak'
  if (metCount === 3) return 'fair'
  if (metCount === 4) return 'good'
  return 'strong'
}

export function evaluatePassword(password: string) {
  const met = PASSWORD_REQUIREMENTS.map((requirement) => requirement.test(password))
  const metCount = met.filter(Boolean).length
  return { met, metCount, level: strengthLevel(metCount), isStrong: metCount === PASSWORD_REQUIREMENTS.length }
}
