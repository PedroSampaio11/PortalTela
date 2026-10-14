import { Outlet } from 'react-router-dom'
import { DemoGuide } from '@/features/demo'

/** Raiz do app: as telas e o guia de demonstração (que só aparece com `?demo`). */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <DemoGuide />
    </>
  )
}
