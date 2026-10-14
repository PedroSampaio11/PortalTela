import type { ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { Icon } from '../Icon'
import styles from './NavButton.module.css'

interface Common {
  /** Texto acessível (o botão só tem ícone). */
  label: string
}

type AsRoute = Common & Omit<LinkProps, 'children' | 'aria-label'> & { to: LinkProps['to'] }
type AsAction = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & { to?: undefined }

/** `NavButton` do DS (2935:54987), Style=Ghost, Direction=Back. Voltar: 44px, ícone de 28px. */
export function NavButton(props: AsRoute | AsAction) {
  if (props.to !== undefined) {
    const { label, className, ...rest } = props
    return (
      <Link {...rest} className={[styles.button, className].filter(Boolean).join(' ')} aria-label={label}>
        <Icon name="arrow-left-01" size={28} />
      </Link>
    )
  }
  const { label, className, type = 'button', ...rest } = props
  return (
    <button {...rest} type={type} className={[styles.button, className].filter(Boolean).join(' ')} aria-label={label}>
      <Icon name="arrow-left-01" size={28} />
    </button>
  )
}
