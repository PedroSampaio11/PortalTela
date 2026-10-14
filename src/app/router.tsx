import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/login/LoginPage'
import { RecoveryPage } from '@/features/auth/recovery/RecoveryPage'
import { SignUpPage } from '@/features/auth/signup/SignUpPage'
import { HomePage } from '@/features/home/HomePage'
import { LegalPage } from '@/features/legal/LegalPage'
import { RootLayout } from './RootLayout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/entrar', element: <LoginPage /> },
      { path: '/recuperar-senha', element: <RecoveryPage /> },
      { path: '/cadastro', element: <SignUpPage /> },
      { path: '/termos', element: <LegalPage title="Termos de uso" /> },
      { path: '/privacidade', element: <LegalPage title="Política de privacidade" /> },
      { path: '*', element: <Navigate to="/entrar" replace /> },
    ],
  },
])
