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

test.describe('ilustração', () => {
  test('cena, personagem e animação carregam inteiros, em alta qualidade', async ({ page }) => {
    await page.goto('/entrar')
    const layers = page.locator('[data-scene="balcony"] [data-layer]')
    await expect(layers).toHaveCount(3)
    await expect(page.locator('[data-scene="balcony"] [data-layer="motion"][data-loaded]')).toHaveCount(1, { timeout: 10_000 })
    const info = await layers.evaluateAll((imgs) =>
      (imgs as HTMLImageElement[]).map((img) => ({ layer: img.dataset.layer, ok: img.complete && img.naturalWidth > 0, w: img.naturalWidth })),
    )
    expect(info.every((i) => i.ok)).toBe(true)
    // A cena e a personagem têm a resolução original do Figma (1440 de largura): nada é reduzido.
    expect(info.find((i) => i.layer === 'plate')!.w).toBe(1440)
    expect(info.find((i) => i.layer === 'character')!.w).toBe(1440)
  })

  test('as camadas NÃO remontam nem recarregam ao navegar entre telas e estados', async ({ page }) => {
    await page.goto('/entrar?demo')
    await expect(page.locator('[data-layer="motion"][data-loaded]').first()).toBeAttached({ timeout: 10_000 })
    // Cena e personagem de todas as cenas ficam montadas; a animação só existe na cena visível
    // (a outra o desmonta ao fim da troca, de propósito), por isso não entra na comparação.
    const STATIC = '[data-layer="plate"], [data-layer="character"]'
    await page.evaluate((sel) => {
      ;(window as unknown as { __layers: Element[] }).__layers = [...document.querySelectorAll(sel)]
    }, STATIC)
    const same = () =>
      page.evaluate((sel) => {
        const before = (window as unknown as { __layers: Element[] }).__layers
        const now = [...document.querySelectorAll(sel)]
        return before.length === now.length && before.every((node, i) => node === now[i] && node.isConnected)
      }, STATIC)

    await page.getByRole('link', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/cadastro/)
    expect(await same()).toBe(true)
    await page.getByRole('link', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/entrar/)
    expect(await same()).toBe(true)
    // Navegador de estados: pula entre estados e fluxos.
    await page.keyboard.press('Alt+ArrowRight')
    await page.keyboard.press('Alt+ArrowRight')
    await page.keyboard.press('Alt+ArrowRight')
    expect(await same()).toBe(true)
  })

  test('só a cena visível mantém a animação montada (a outra o libera após a troca)', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.locator('[data-scene="balcony"] [data-layer="motion"][data-loaded]')).toHaveCount(1, { timeout: 10_000 })
    await expect(page.locator('[data-layer="motion"]')).toHaveCount(1)
    await page.getByRole('link', { name: 'Criar conta' }).click()
    await expect(page.locator('[data-scene="stairs"] [data-layer="motion"]')).toHaveCount(1)
    await expect(page.locator('[data-layer="motion"]')).toHaveCount(1, { timeout: 5_000 })
    await expect(page.locator('[data-scene="balcony"] [data-layer="motion"]')).toHaveCount(0)
  })

  test('a troca de cena não deixa "buraco": a cobertura nunca cai', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.locator('[data-layer="motion"][data-loaded]').first()).toBeAttached({ timeout: 10_000 })
    await page.evaluate(() => {
      const w = window as unknown as { __minCoverage: number }
      w.__minCoverage = 1
      const scenes = [...document.querySelectorAll<HTMLElement>('[data-scene]')]
      const tick = () => {
        // As cenas estão empilhadas: a cobertura é 1 - produto de (1 - opacidade).
        const coverage = 1 - scenes.reduce((acc, el) => acc * (1 - Number(getComputedStyle(el).opacity)), 1)
        w.__minCoverage = Math.min(w.__minCoverage, coverage)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.getByRole('link', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/cadastro/)
    await page.waitForTimeout(1200)
    const min = await page.evaluate(() => (window as unknown as { __minCoverage: number }).__minCoverage)
    expect(min).toBeGreaterThan(0.999)
    await expect(page.locator('[data-scene="stairs"]')).toHaveAttribute('data-active', 'true')
  })

  test('Login e Recuperação usam a mesma cena (sem troca nenhuma entre elas)', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.locator('[data-scene="balcony"]')).toHaveAttribute('data-active', 'true')
    await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
    await expect(page).toHaveURL(/recuperar-senha/)
    await expect(page.locator('[data-scene="balcony"]')).toHaveAttribute('data-active', 'true')
  })

  test('com "reduzir movimento" só a cena e a personagem (sem animação)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1024 } })
    const page = await context.newPage()
    await page.goto('/entrar')
    await page.waitForLoadState('load')
    await page.waitForTimeout(800)
    await expect(page.locator('[data-layer="plate"]')).toHaveCount(2)
    await expect(page.locator('[data-layer="character"]')).toHaveCount(2)
    await expect(page.locator('[data-layer="motion"]')).toHaveCount(0)
    await context.close()
  })
})

test.describe('interação fluida: a tela não muda de tamanho', () => {
  const geometry = (page: Page) =>
    page.evaluate(() => {
      const card = document.querySelector('main')!.firstElementChild!
      const top = (selector: string) => Math.round(card.querySelector(selector)!.getBoundingClientRect().top)
      return { height: Math.round(card.getBoundingClientRect().height), title: top('h1'), submit: top('button[type="submit"]') }
    })

  test('login: helper de validação e erro de credencial não mexem em nada', async ({ page }) => {
    await page.goto('/entrar')
    await page.waitForTimeout(800)
    const base = await geometry(page)

    await page.getByLabel('E-mail').fill('x')
    await page.getByLabel('E-mail').blur()
    await expect(page.getByText('Digite um e-mail válido')).toBeVisible()
    expect(await geometry(page)).toEqual(base)

    await page.getByLabel('E-mail').fill('test@gmail.com')
    await page.getByLabel('Senha', { exact: true }).fill('errada123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos', { timeout: 10_000 })
    expect(await geometry(page)).toEqual(base)
  })

  test('cadastro: erros dos campos e dos termos não mexem em nada', async ({ page }) => {
    await page.goto('/cadastro')
    await page.waitForTimeout(800)
    const base = await geometry(page)
    await page.getByLabel('E-mail').fill('x')
    await page.getByLabel('E-mail').blur()
    await page.getByLabel('Nome completo').focus()
    await page.getByLabel('Nome completo').blur()
    await page.waitForTimeout(500)
    expect(await geometry(page)).toEqual(base)
  })
})

test.describe('senha', () => {
  async function toPasswordStep(page: Page) {
    await page.goto('/cadastro?demo&state=signup.password')
    await expect(page.getByRole('heading', { name: 'Crie sua senha' })).toBeVisible()
  }

  test('criar senha: colar e copiar são bloqueados; digitar funciona', async ({ page }) => {
    await toPasswordStep(page)
    const confirm = page.getByLabel('Confirmar senha')
    const blocked = await confirm.evaluate((el) => {
      const dt = new DataTransfer()
      dt.setData('text/plain', 'Colada@123')
      const paste = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })
      el.dispatchEvent(paste)
      const copy = new ClipboardEvent('copy', { bubbles: true, cancelable: true })
      el.dispatchEvent(copy)
      return { paste: paste.defaultPrevented, copy: copy.defaultPrevented, value: (el as HTMLInputElement).value }
    })
    expect(blocked).toEqual({ paste: true, copy: true, value: expect.not.stringContaining('Colada') })
    await expect(page.getByText('Digite a senha, colar não é permitido.')).toBeVisible()
    await confirm.click()
    await page.keyboard.type('Digitada@123')
    await expect(confirm).toHaveValue('Digitada@123')
  })

  test('aviso de Caps Lock aparece no espaço do helper e some ao desligar', async ({ page }) => {
    await page.goto('/entrar')
    const password = page.getByLabel('Senha', { exact: true })
    await page.waitForTimeout(800)
    const before = await page.evaluate(() => Math.round(document.querySelector('main')!.firstElementChild!.getBoundingClientRect().height))
    await password.focus()
    await password.evaluate((el) => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', bubbles: true, modifierCapsLock: true })))
    await expect(page.getByText(/Caps Lock ativado/)).toBeVisible()
    expect(await page.evaluate(() => Math.round(document.querySelector('main')!.firstElementChild!.getBoundingClientRect().height))).toBe(before)
    await password.evaluate((el) => el.dispatchEvent(new KeyboardEvent('keyup', { key: 'CapsLock', bubbles: true, modifierCapsLock: false })))
    await expect(page.getByText(/Caps Lock ativado/)).toHaveCount(0)
  })
})

test('etapa do código mostra o e-mail com o começo escondido', async ({ page }) => {
  await signUpToCodeStep(page)
  await expect(page.getByText('Enviamos um código de 6 dígitos para *****ouza@email.com')).toBeVisible()
})
