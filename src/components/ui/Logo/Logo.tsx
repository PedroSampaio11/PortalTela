import logoWide from '@/assets/brand/logo-wide-on-light-brand.svg'

interface LogoProps {
  className?: string
}

/** `Logo` do DS, Layout=Wide, Color=OnLightBrand. Proporção original 384.8 x 89.8. */
export function Logo({ className }: LogoProps) {
  return <img src={logoWide} alt="Portal Tela" width={146} height={34} className={className} />
}
