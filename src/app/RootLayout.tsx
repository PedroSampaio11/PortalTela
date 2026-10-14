import { Outlet, useLocation } from 'react-router-dom'
import { DemoGuide } from '@/features/demo'

/**
 * Raiz do app: as telas e o guia de demonstração (que só aparece com `?demo`).
 * A tela remonta a cada navegação (inclusive para o mesmo estado), para o navegador de estados
 * poder reabrir um estado do zero.
 */
export function RootLayout() {
  const location = useLocation()
  return (
    <>
      <Outlet key={location.key} />
      <DemoGuide />
    </>
  )
}
