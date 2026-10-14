import type { AuthIllustration } from '@/components/auth/AuthLayout'
import loginStill from '@/assets/images/login-still.webp'
import loginAnimated from '@/assets/images/login-animated.webp'
import signupStill from '@/assets/images/signup-still.webp'
import signupAnimated from '@/assets/images/signup-animated.webp'

/**
 * Uma ilustração por fluxo. O Figma troca a cena entre estados do mesmo fluxo (varanda no frame padrão
 * de Login e Recuperação, escadaria nos demais) e vem sendo editado; aqui fica fixa por fluxo para a
 * tela não "piscar" entre estados. Para trocar, basta apontar o fluxo para outro par still/animated.
 */
export const loginIllustration: AuthIllustration = { still: loginStill, animated: loginAnimated }
export const signupIllustration: AuthIllustration = { still: signupStill, animated: signupAnimated }
/** Recuperação: o Figma mostra hoje a mesma varanda do Login no frame padrão (antes era um terraço com um homem, ainda em design-source/unused). */
export const recoveryIllustration: AuthIllustration = loginIllustration
