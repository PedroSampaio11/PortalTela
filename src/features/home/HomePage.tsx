import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { getSession, logout } from '@/features/auth/mock/authApi'
import styles from './HomePage.module.css'

/**
 * Destino provisório após entrar. A Home do Portal Tela fica fora do escopo desta entrega
 * (autenticação); esta tela só prova que a sessão mockada foi criada.
 */
export function HomePage() {
  const navigate = useNavigate()
  const session = getSession()

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{session ? `Olá, ${session.name.split(' ')[0]}.` : 'Portal Tela'}</h1>
      <p className={styles.text}>
        {session
          ? `Você entrou como ${session.email}. Esta é uma tela provisória: a Home fica fora do escopo da autenticação.`
          : 'Você ainda não entrou. Esta é uma tela provisória: a Home fica fora do escopo da autenticação.'}
      </p>
      <div className={styles.actions}>
        {session ? (
          <Button
            variant="outline"
            icon={false}
            onClick={() => {
              logout()
              navigate('/entrar')
            }}
          >
            Sair
          </Button>
        ) : (
          <Button variant="solid" onClick={() => navigate('/entrar')}>
            Entrar
          </Button>
        )}
      </div>
    </main>
  )
}
