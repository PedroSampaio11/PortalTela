import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource-variable/lora'
import '@fontsource-variable/manrope'
import '@fontsource-variable/plus-jakarta-sans'
import '@/styles/globals.css'
import { router } from '@/app/router'
import { applyStoredDemoSettings } from '@/features/demo'

applyStoredDemoSettings()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
