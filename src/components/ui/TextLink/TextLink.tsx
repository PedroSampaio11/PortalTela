import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { cx } from '@/lib/cx'
import styles from './TextLink.module.css'

type Size = 'sm' | 'md'

interface Common {
  /** Figma `Size`. `sm` = 14px (body/sm/medium), `md` = 16px (body/md/medium). */
  size?: Size
  children: ReactNode
}

type AsRoute = Common & Omit<LinkProps, 'children'> & { to: LinkProps['to'] }
type AsAction = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { to?: undefined }

/**
 * `Link` do DS (2935:63839). Navega com `to` (rota) ou dispara uma ação (botão com cara de link,
 * ex.: "Reenviar código"). Estados do DS: Default, Hover, Disabled, Focus.
 */
export function TextLink(props: AsRoute | AsAction) {
  if (props.to !== undefined) {
    const { size = 'sm', className, children, ...rest } = props
    return (
      <Link {...rest} className={cx(styles.link, className)} data-size={size}>
        {children}
      </Link>
    )
  }
  const { size = 'sm', className, children, type = 'button', ...rest } = props
  return (
    <button {...rest} type={type} className={cx(styles.link, styles.action, className)} data-size={size}>
      {children}
    </button>
  )
}
