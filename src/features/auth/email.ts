/**
 * Mascara o e-mail como no Figma: `ana.souza@email.com` vira `*****ouza@email.com`
 * (mantém os 4 últimos caracteres do nome e o domínio).
 */
export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.trim().split('@')
  if (!domain) return email
  const visible = local.length > 4 ? 4 : Math.min(1, local.length)
  const hidden = Math.max(local.length - visible, 1)
  return `${'*'.repeat(hidden)}${local.slice(local.length - visible)}@${domain}`
}
