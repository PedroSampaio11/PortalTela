import { z } from 'zod'

/** Mensagens: dizem qual campo e o que fazer (content-design-ux-writing: erro de validação). */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Esse e-mail não parece válido. Use o formato nome@dominio.com.'))

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
  remember: z.boolean(),
})

export type LoginValues = z.infer<typeof loginSchema>
