import { z } from 'zod'

/**
 * Schemas de validação dos formulários de autenticação (zod + react-hook-form).
 * Mensagens: dizem qual campo e o que fazer (content-design-ux-writing: erro de validação).
 * A senha não passa por aqui: os requisitos e a confirmação vivem em `passwordRules.ts` e no `PasswordStep`.
 */

/** E-mail do login e da recuperação: vazio e formato inválido têm mensagens distintas. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Digite um e-mail válido'))

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
  /** Obrigatório para entrar (como o aceite dos termos no cadastro). */
  remember: z.boolean().refine((value) => value, 'Marque "Manter-me conectado" para continuar.'),
})

export const recoveryEmailSchema = z.object({ email: emailSchema })

/** Cadastro (etapa 1): e-mail vazio e inválido compartilham a mesma mensagem, com exemplo (coberta em SignUpPage.test). */
export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .refine((value) => value.split(/\s+/).filter((part) => part.length > 0).length >= 2, 'Informe nome e sobrenome.'),
  email: z.string().trim().pipe(z.email('Digite um e-mail válido, como nome@email.com.')),
  terms: z.boolean().refine((value) => value, 'Aceite os termos para continuar.'),
})

export type LoginValues = z.infer<typeof loginSchema>
export type RecoveryEmailValues = z.infer<typeof recoveryEmailSchema>
export type SignUpDetails = z.infer<typeof signUpSchema>
