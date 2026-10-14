import { useEffect } from 'react'
import { TextLink } from '@/components/ui'
import styles from './LegalPage.module.css'

interface LegalPageProps {
  title: string
}

/** Página de apoio dos links de aceite. Conteúdo ilustrativo: o texto jurídico real fica fora do escopo. */
export function LegalPage({ title }: LegalPageProps) {
  useEffect(() => {
    document.title = `${title} | Portal Tela`
  }, [title])

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>
        Conteúdo ilustrativo. Nesta demonstração o texto jurídico não está incluído; esta página só existe para
        os links de aceite do cadastro levarem a algum lugar sem fazer a pessoa perder o que preencheu.
      </p>
      <TextLink to="/cadastro" size="md">
        Voltar ao cadastro
      </TextLink>
    </main>
  )
}
