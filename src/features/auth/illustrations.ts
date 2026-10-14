import type { AuthIllustration } from '@/components/auth/AuthLayout'
import loginStill from '@/assets/images/login-still.png'
import loginAnimated from '@/assets/images/login-animated.gif'
import signupStill from '@/assets/images/signup-still.png'
import signupAnimated from '@/assets/images/signup-animated.gif'

/**
 * Uma ilustração por fluxo. O Figma troca a cena entre estados do mesmo fluxo (Login usa varanda
 * no estado padrão e escadaria nos demais); aqui fica fixa por fluxo para a tela não "piscar" entre
 * estados. Pendência registrada para o design confirmar.
 */
export const loginIllustration: AuthIllustration = { still: loginStill, animated: loginAnimated }
export const signupIllustration: AuthIllustration = { still: signupStill, animated: signupAnimated }
