import type { CSSProperties } from 'react'
import { cx } from '@/lib/cx'
import arrowLeft01 from '@/assets/icons/arrow-left-01.svg'
import arrowUpRight01 from '@/assets/icons/arrow-up-right-01.svg'
import cancelCircle from '@/assets/icons/cancel-circle.svg'
import check from '@/assets/icons/check.svg'
import indeterminate from '@/assets/icons/indeterminate.svg'
import loading03 from '@/assets/icons/loading-03.svg'
import view from '@/assets/icons/view.svg'
import viewOffSlash from '@/assets/icons/view-off-slash.svg'
import apple from '@/assets/brand/apple.svg'
import alert01 from '@/assets/icons/alert-01.svg'
import checkCircle from '@/assets/icons/check-circle.svg'
import checkmarkCircle16 from '@/assets/icons/checkmark-circle-16.svg'
import checkmarkCircle36 from '@/assets/icons/checkmark-circle-36.svg'
import circleDashed16 from '@/assets/icons/circle-dashed-16.svg'
import informationCircle from '@/assets/icons/information-circle.svg'
import tick02 from '@/assets/icons/tick-02.svg'
import styles from './Icon.module.css'

/** Ícones do DS (traço de 1.5px). Um arquivo por ícone, exportado do Figma sem edição. */
const ICONS = {
  'arrow-left-01': arrowLeft01,
  'arrow-up-right-01': arrowUpRight01,
  'cancel-circle': cancelCircle,
  check,
  indeterminate,
  'loading-03': loading03,
  view,
  'view-off-slash': viewOffSlash,
  apple,
  'alert-01': alert01,
  'check-circle': checkCircle,
  'checkmark-circle-16': checkmarkCircle16,
  'checkmark-circle-36': checkmarkCircle36,
  'circle-dashed-16': circleDashed16,
  'information-circle': informationCircle,
  'tick-02': tick02,
} as const

export type IconName = keyof typeof ICONS

interface IconProps {
  name: IconName
  /** Lado do ícone em px. Padrão do DS: 24. */
  size?: number
  width?: number
  height?: number
  spin?: boolean
  className?: string
}

/**
 * Renderiza o SVG do DS como máscara: a cor vem de `currentColor`, então o mesmo
 * arquivo serve a todos os estados (default, hover, disabled, erro) sem redesenhar.
 */
export function Icon({ name, size = 24, width, height, spin, className }: IconProps) {
  const style = {
    '--icon-mask': `url("${ICONS[name]}")`,
    width: width ?? size,
    height: height ?? size,
  } as CSSProperties
  return <span aria-hidden="true" className={cx(styles.icon, spin && styles.spin, className)} style={style} />
}
