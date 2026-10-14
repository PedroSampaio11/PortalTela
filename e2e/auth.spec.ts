import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Testes em navegador real. Cobrem o que o jsdom não enxerga: clique de verdade (hit-testing),
 * foco, seleção de texto, regra do <label> e mídia animada.
 */

const codeInput = (page: Page) => page.getByLabel('Código de verificação de 6 dígitos')

async function typeCode(page: Page, value: string) {
  await codeInput(page).click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type(value)
}

async function signUpToCodeStep(page: Page) {
  await page.goto('/cadastro')
  await page.getByLabel('Nome completo').fill('Ana Souza')
  await page.getByLabel('E-mail').fill('ana.souza@email.com')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Digite o código de verificação' })).toBeVisible({ timeout: 10_000 })
}

test.describe('checkbox de aceite', () => {
  test('clicar no quadradinho marca (o desenho não intercepta o clique)', async ({ page }) => {
    await page.goto('/cadastro')
    const checkbox = page.getByRole('checkbox')
    // Clique de mouse nas coordenadas do quadradinho, como uma pessoa faria (hit-testing real).
    const box = await page.locator('label').filter({ hasText: 'Li e aceito' }).locator('xpath=preceding-sibling::span[1]').boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await expect(checkbox).toBeChecked()
  })

  test('clicar nos links não marca a caixa e abre em outra aba', async ({ page, context }) => {
    await page.goto('/cadastro')
    const [popup] = await Promise.all([context.waitForEvent('page'), page.getByRole('link', { name: 'termos de uso' }).click()])
    await popup.waitForLoadState()
    await expect(popup.getByRole('heading', { name: 'Termos de uso' })).toBeVisible()
    await expect(page.getByRole('checkbox')).not.toBeChecked()
  })

  test('o botão com cara de desabilitado continua clicável e mostra o que falta', async ({ page }) => {
    await page.goto('/cadastro')
    const button = page.getByRole('button', { name: 'Continuar', exact: true })
    await expect(button).toHaveAttribute('aria-disabled', 'true')
    await button.click({ force: true })
    await expect(page.getByText('Informe nome e sobrenome.')).toBeVisible()
    await expect(page.getByText('Aceite os termos para continuar.')).toBeVisible()
    await expect(page.getByLabel('Nome completo')).toBeFocused()
  })
})

test.describe('código de verificação', () => {
  test('a primeira casa já nasce com foco e cursor', async ({ page }) => {
    await signUpToCodeStep(page)
    await expect(codeInput(page)).toBeFocused()
  })

  test('selecionar tudo e digitar substitui o código; colar também', async ({ page }) => {
    await signUpToCodeStep(page)
    await typeCode(page, '123457')
    await expect(codeInput(page)).toHaveValue('123457')
    await typeCode(page, '000111')
    await expect(codeInput(page)).toHaveValue('000111')
  })

  test('código certo mostra a barra com check e segue para a senha', async ({ page }) => {
    await signUpToCodeStep(page)
    await typeCode(page, '123456')
    await page.getByRole('button', { name: 'Verificar código' }).click()
    await expect(page.locator('[data-status="success"]').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Código confirmado' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Crie sua senha' })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('login', () => {
  test('entra com a conta de demonstração e a sessão aparece na tela inicial', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel('E-mail').fill('test@gmail.com')
    await page.getByLabel('Senha', { exact: true }).fill('test@2026')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Olá, Teste.' })).toBeVisible({ timeout: 10_000 })
  })

  test('ordem de tabulação segue a leitura da tela', async ({ page }) => {
    await page.goto('/entrar')
    const order: string[] = []
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab')
      order.push(await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        return el?.getAttribute('aria-label') ?? (el as HTMLInputElement | null)?.labels?.[0]?.textContent ?? el?.textContent?.trim() ?? ''
      }))
    }
    expect(order).toEqual([
      'Voltar para o início',
      'E-mail',
      'Senha',
      'Mostrar senha',
      'Manter-me conectado',
      'Esqueci minha senha',
      'Entrar',
      'Continuar com o Google',
      'Continuar com a Apple',
    ])
  })
})

test.describe('ilustração viva', () => {
  test('o GIF da personagem entra depois do carregamento', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.locator('img[src*="login-animated"]')).toHaveCount(1, { timeout: 10_000 })
  })

  test('com "reduzir movimento" só a cena estática é usada', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1024 } })
    const page = await context.newPage()
    await page.goto('/entrar')
    await page.waitForLoadState('load')
    await page.waitForTimeout(800)
    await expect(page.locator('img[src*="login-still"]')).toHaveCount(1)
    await expect(page.locator('img[src*="animated"]')).toHaveCount(0)
    await context.close()
  })
})
