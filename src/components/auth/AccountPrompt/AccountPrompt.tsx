import { TextLink } from '@/components/ui/TextLink'
import styles from './AccountPrompt.module.css'

interface AccountPromptProps {
  /** Figma `Intent`: SignUp = "Ainda não tem conta? Criar conta"; SignIn = "Já tem uma conta? Entrar". */
  intent: 'sign-up' | 'sign-in'
  to: string
}

const COPY = {
  'sign-up': { text: 'Ainda não tem conta?', action: 'Criar conta' },
  'sign-in': { text: 'Já tem uma conta?', action: 'Entrar' },
} as const

/** `AccountPrompt` do DS (2964:107): convite para trocar de fluxo, no rodapé do formulário. */
export function AccountPrompt({ intent, to }: AccountPromptProps) {
  const { text, action } = COPY[intent]
  return (
    <p className={styles.prompt}>
      <span className={styles.text}>{text}</span>
      <TextLink to={to}>{action}</TextLink>
    </p>
  )
}
