import { expect, test } from '@playwright/test'
import { DEMO_STATES, demoHref } from '../src/features/demo/scenarios'

/**
 * Integridade de layout em TODOS os estados das 3 telas, em vários tamanhos de janela.
 * Garante: SEM rolagem (vertical nem horizontal), tudo dentro da janela, título nunca sobre o logo,
 * nada vaza do cartão, copyright sempre abaixo do conteúdo.
 * (Bug original: com helper text o "Entrar" subia por cima do logo.)
 */
const VIEWPORTS = [
  { name: '1440x1024', width: 1440, height: 1024 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x600', width: 1440, height: 600 },
  { name: '1440x1300', width: 1440, height: 1300 },
  { name: '900x600', width: 900, height: 600 },
]

for (const viewport of VIEWPORTS) {
  test.describe(`layout ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const state of DEMO_STATES) {
      test(`${state.id}`, async ({ page }) => {
        await page.goto(demoHref(state.id))
        await page.waitForLoadState('load')
        await page.locator('h1').first().waitFor()
        await page.waitForTimeout(600) // entrada animada e Reveal assentam

        const report = await page.evaluate(() => {
          const rect = (el: Element) => el.getBoundingClientRect()
          const logo = document.querySelector('img[alt="Portal Tela"]')!
          const h1 = document.querySelector('h1')!
          const main = document.querySelector('main')!
          const card = main.parentElement!
          const copyright = [...card.querySelectorAll('p')].find((p) => p.textContent?.includes('Todos os direitos'))!
          const content = main.firstElementChild!
          const cardRect = rect(card)
          const problems: string[] = []

          if (rect(h1).top < rect(logo).bottom + 8) problems.push(`título (${Math.round(rect(h1).top)}) encosta ou passa do logo (${Math.round(rect(logo).bottom)})`)
          if (rect(content).bottom > rect(copyright).top - 8) problems.push(`conteúdo (${Math.round(rect(content).bottom)}) encosta no copyright (${Math.round(rect(copyright).top)})`)
          if (document.documentElement.scrollWidth > window.innerWidth) problems.push(`rolagem horizontal (${document.documentElement.scrollWidth} > ${window.innerWidth})`)
          if (document.documentElement.scrollHeight > window.innerHeight) problems.push(`ROLAGEM VERTICAL (${document.documentElement.scrollHeight} > ${window.innerHeight})`)
          if (document.body.scrollHeight > window.innerHeight) problems.push(`rolagem vertical no body (${document.body.scrollHeight} > ${window.innerHeight})`)
          if (cardRect.top < -0.5 || cardRect.bottom > window.innerHeight + 0.5) problems.push(`cartão fora da janela (${Math.round(cardRect.top)}..${Math.round(cardRect.bottom)} de ${window.innerHeight})`)
          if (rect(copyright).bottom > window.innerHeight + 0.5) problems.push('copyright fora da janela')

          for (const el of main.querySelectorAll('*')) {
            if (el.classList.contains('visually-hidden')) continue
            const r = rect(el)
            if (r.width === 0 || r.height === 0) continue
            if (r.left < cardRect.left - 1 || r.right > cardRect.right + 1) {
              problems.push(`<${el.tagName.toLowerCase()} ${String(el.className).slice(0, 30)}> vaza do cartão (${Math.round(r.left)}..${Math.round(r.right)} fora de ${Math.round(cardRect.left)}..${Math.round(cardRect.right)})`)
              break
            }
          }
          // O cartão cresce com o conteúdo: nenhum filho da coluna pode passar do fim do cartão.
          if (rect(copyright).bottom > cardRect.bottom + 1) problems.push('copyright fora do cartão')
          return problems
        })

        expect(report, `${state.id} @ ${viewport.name}`).toEqual([])
      })
    }
  })
}

test.describe('navegador de estados', () => {
  test('o guia só aparece com ?demo e abre qualquer estado direto', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.getByRole('button', { name: /^Demo/ })).toHaveCount(0)

    await page.goto('/entrar?demo')
    await page.getByRole('button', { name: /^Demo/ }).click()
    await page.getByRole('button', { name: 'Bloqueado', exact: true }).click()
    await expect(page.getByText(/Muitas tentativas/)).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'E-mail' })).toBeDisabled()

    await page.getByRole('button', { name: 'Código: expirado' }).first().click()
    await expect(page).toHaveURL(/state=signup\.code-expired|state=recovery\.code-expired/)
    await expect(page.getByText('Esse código expirou. Peça um novo.')).toBeVisible()
  })

  test('anterior, próximo e Alt+setas percorrem a lista inteira', async ({ page }) => {
    await page.goto(demoHref('login.default'))
    await page.keyboard.press('Alt+ArrowRight')
    await expect(page).toHaveURL(/state=login\.validation/)
    await expect(page.getByText('Informe seu e-mail.')).toBeVisible()
    await page.keyboard.press('Alt+ArrowRight')
    await expect(page).toHaveURL(/state=login\.filled/)
    await page.keyboard.press('Alt+ArrowLeft')
    await expect(page).toHaveURL(/state=login\.validation/)

    // Do último volta ao primeiro.
    await page.goto(demoHref(DEMO_STATES[DEMO_STATES.length - 1]!.id))
    await page.keyboard.press('Alt+ArrowRight')
    await expect(page).toHaveURL(new RegExp(`state=${DEMO_STATES[0]!.id.replace('.', '\\.')}`))
  })

  test('o passeio automático avança sozinho', async ({ page }) => {
    await page.goto(demoHref('login.default'))
    await page.getByRole('button', { name: /^Demo/ }).click()
    await page.getByRole('button', { name: 'Passeio automático' }).click()
    await expect(page).toHaveURL(/state=login\.validation/, { timeout: 8_000 })
    await page.getByRole('button', { name: 'Pausar passeio' }).click()
  })

  test('estados congelados continuam interativos', async ({ page }) => {
    await page.goto(demoHref('login.filled'))
    await expect(page.getByRole('textbox', { name: 'E-mail' })).toHaveValue('test@gmail.com')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Olá, Teste.' })).toBeVisible({ timeout: 10_000 })
  })
})
