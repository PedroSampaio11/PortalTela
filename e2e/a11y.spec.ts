import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Auditoria automática de acessibilidade (WCAG 2.1 A e AA) em cada tela e estado relevante.
 * Controles desabilitados são isentos de contraste pela própria WCAG; imagens de fundo não são medidas.
 */
async function audit(page: Page, label: string) {
  // Espera as transições (150 a 400 ms) terminarem: o axe mediria uma cor intermediária.
  await page.waitForTimeout(600)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
  expect(summary, `${label}: violações de acessibilidade`).toEqual([])
}

const code = (page: Page) => page.getByLabel('Código de verificação de 6 dígitos')

async function setCode(page: Page, value: string) {
  await code(page).click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type(value)
}

test('login: padrão, erro de validação, erro de credencial e bloqueio', async ({ page }) => {
  await page.goto('/entrar')
  await audit(page, 'login padrão')

  await page.getByRole('button', { name: 'Entrar', exact: true }).click({ force: true })
  await expect(page.getByText('Informe seu e-mail.')).toBeVisible()
  await audit(page, 'login com erros de campo')

  await page.getByLabel('E-mail').fill('ana.souza@email.com')
  await page.getByLabel('Senha', { exact: true }).fill('errada')
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).not.toHaveAttribute('aria-busy', 'true')
  }
  await audit(page, 'login com erro de credencial')

  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByText(/Muitas tentativas/)).toBeVisible({ timeout: 10_000 })
  await audit(page, 'login bloqueado')
})

test('login: carregamento social', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByRole('button', { name: 'Continuar com a Apple' }).click()
  await audit(page, 'login com social carregando')
  await expect(page.getByText(/Não foi possível conectar/)).toBeVisible({ timeout: 10_000 })
  await audit(page, 'login com erro social')
})

test('recuperação: e-mail, código (erro, expirado), senha e resultado', async ({ page }) => {
  await page.goto('/recuperar-senha')
  await audit(page, 'recuperação e-mail')
  await page.getByLabel('E-mail').fill('ana.souza@')
  await page.keyboard.press('Tab')
  await expect(page.getByText('Digite um e-mail válido')).toBeVisible()
  await audit(page, 'recuperação e-mail com erro')

  await page.getByLabel('E-mail').fill('ana.souza@email.com')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Código enviado' })).toBeVisible({ timeout: 10_000 })
  await audit(page, 'recuperação resultado')
  await expect(page.getByRole('heading', { name: 'Digite o código de verificação' })).toBeVisible({ timeout: 10_000 })
  await audit(page, 'recuperação código')

  await setCode(page, '111111')
  await page.getByRole('button', { name: 'Verificar código' }).click()
  await expect(page.getByText('Código incorreto')).toBeVisible({ timeout: 10_000 })
  await audit(page, 'recuperação código incorreto')

  await setCode(page, '000000')
  await page.getByRole('button', { name: 'Verificar código' }).click()
  await expect(page.getByText('Esse código expirou')).toBeVisible({ timeout: 10_000 })
  await audit(page, 'recuperação código expirado')

  await setCode(page, '123456')
  await page.getByRole('button', { name: 'Verificar código' }).click()
  await expect(page.getByRole('heading', { name: 'Crie uma nova senha' })).toBeVisible({ timeout: 15_000 })
  await page.getByLabel('Nova senha', { exact: true }).fill('ABCDEFGH')
  await audit(page, 'recuperação senha fraca')
  await page.getByLabel('Nova senha', { exact: true }).fill('Abcdef1!')
  await page.getByLabel('Confirmar nova senha').fill('Abcdef1?')
  await page.keyboard.press('Tab')
  await expect(page.getByText('As senhas não são iguais.')).toBeVisible()
  await audit(page, 'recuperação senhas diferentes')
})

test('cadastro: dados com erros, preenchido e código bloqueado', async ({ page }) => {
  await page.goto('/cadastro')
  await audit(page, 'cadastro padrão')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click({ force: true })
  await expect(page.getByText('Aceite os termos para continuar.')).toBeVisible()
  await audit(page, 'cadastro com erros')

  await page.getByLabel('Nome completo').fill('Ana Souza')
  await page.getByLabel('E-mail').fill('ana.souza@email.com')
  await page.getByRole('checkbox').check()
  await audit(page, 'cadastro preenchido')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Digite o código de verificação' })).toBeVisible({ timeout: 15_000 })
  for (let i = 0; i < 3; i++) {
    await setCode(page, '111111')
    await page.getByRole('button', { name: 'Verificar código' }).click()
    await page.waitForTimeout(1800)
  }
  await expect(page.getByText(/Muitas tentativas/)).toBeVisible({ timeout: 10_000 })
  await audit(page, 'cadastro código bloqueado')
})

test('estados do navegador de estados e o próprio guia aberto', async ({ page }) => {
  const ids = [
    'login.validation',
    'login.blocked',
    'login.social-error',
    'recovery.email-error',
    'recovery.code-error',
    'recovery.code-expired',
    'recovery.code-success',
    'recovery.password-mismatch',
    'signup.details-error',
    'signup.code-blocked',
    'signup.password-valid',
    'signup.done',
  ]
  for (const id of ids) {
    const route = id.startsWith('login') ? '/entrar' : id.startsWith('signup') ? '/cadastro' : '/recuperar-senha'
    await page.goto(`${route}?demo&state=${id}`)
    await page.locator('h1').first().waitFor()
    await audit(page, id)
  }
  await page.getByRole('button', { name: /^Demo/ }).click()
  await expect(page.getByRole('region', { name: 'Guia de demonstração' })).toBeVisible()
  await audit(page, 'guia de demonstração aberto')
})
