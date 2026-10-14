import { createBrowserRouter, Navigate } from 'react-router-dom'
import { HomePage } from '@/features/home/HomePage'
import { LoginPage } from '@/features/auth/login/LoginPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/entrar', element: <LoginPage /> },
  { path: '*', element: <Navigate to="/entrar" replace /> },
])
