import { createBrowserRouter, Navigate } from 'react-router-dom'
import { HomePage } from '@/features/home/HomePage'
import { LoginPage } from '@/features/auth/login/LoginPage'
import { RecoveryPage } from '@/features/auth/recovery/RecoveryPage'
import { SignUpPage } from '@/features/auth/signup/SignUpPage'
import { LegalPage } from '@/features/legal/LegalPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/entrar', element: <LoginPage /> },
  { path: '/recuperar-senha', element: <RecoveryPage /> },
  { path: '/cadastro', element: <SignUpPage /> },
  { path: '/termos', element: <LegalPage title="Termos de uso" /> },
  { path: '/privacidade', element: <LegalPage title="Política de privacidade" /> },
  { path: '*', element: <Navigate to="/entrar" replace /> },
])
