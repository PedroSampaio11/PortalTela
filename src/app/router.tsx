import { createBrowserRouter, Navigate } from 'react-router-dom'
import { HomePage } from '@/features/home/HomePage'
import { LoginPage } from '@/features/auth/login/LoginPage'
import { RecoveryPage } from '@/features/auth/recovery/RecoveryPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/entrar', element: <LoginPage /> },
  { path: '/recuperar-senha', element: <RecoveryPage /> },
  { path: '*', element: <Navigate to="/entrar" replace /> },
])
