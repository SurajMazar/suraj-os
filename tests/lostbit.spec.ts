import { expect, test, type Page } from '@playwright/test'

const shots = process.env.ARCADE_SHOTS

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  ;(page as Page & { errors?: string[] }).errors = errors
})

test.afterEach(async ({ page }) => {
  expect((page as Page & { errors?: string[] }).errors, 'page errors').toEqual([])
})

async function boot(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /unlock/i }).click()
  await expect(page.getByRole('dialog', { name: 'Lock Screen' })).toBeHidden()
  await page.waitForTimeout(400)
}

const bubble = (page: Page) => page.getByRole('dialog', { name: 'Bit says' }).last()

/** Click through Bit's lines until it stops talking or offers a choice. */
async function listen(page: Page, shot?: string) {
  // Bit may still be flying in or the app still loading: give it a moment to start talking.
  await bubble(page)
    .waitFor({ timeout: 4000 })
    .catch(() => {})
  for (let i = 0; i < 40; i++) {
    if (!(await bubble(page).isVisible())) return
    if (shot && i === 1 && shots) await page.screenshot({ path: `${shots}/${shot}.png` })
    if (await bubble(page).getByRole('button').first().isVisible()) return
    await bubble(page).click()
    await page.waitForTimeout(60)
  }
}

const memories = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem('surajos-lostbit') ?? '{}').state?.found ?? []) as string[])

test.describe('Lost Bit on the desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('the whole story plays through', async ({ page }) => {
    test.slow()
    await boot(page)
    await page.keyboard.press('Control+Space')
    await page.keyboard.type('Lost Bit')
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-bit]')).toBeVisible()
    await listen(page, 'bit-prologue')
    await bubble(page).getByRole('button', { name: 'Let’s find them' }).click()
    await listen(page)

    // 1. About Me
    await page.waitForTimeout(700)
    if (shots) await page.screenshot({ path: `${shots}/bit-pointing.png` })
    await page.locator('[data-dock-app="about"]').click()
    await listen(page, 'bit-about')
    await listen(page)
    // 2. Experience
    await page.locator('[data-dock-app="experience"]').click()
    await listen(page)
    await listen(page)
    // 3. Projects: open one
    await page.locator('[data-dock-app="projects"]').click()
    await page.getByRole('button', { name: /^Docsumo Review & Validation Human-in-the-loop/ }).click()
    await listen(page, 'bit-project')
    await listen(page)
    // 4. Terminal
    await page.locator('[data-dock-app="terminal"]').click()
    const input = page.getByRole('textbox', { name: 'Terminal input' })
    await input.fill('whoami')
    await input.press('Enter')
    await listen(page)
    await listen(page)
    // 5. Trash
    await page.locator('[data-dock-app="trash"]').click()
    await page.getByRole('button', { name: 'memory.frag' }).dblclick()
    await listen(page, 'bit-trash')
    await listen(page)
    // 6. Resume
    await page.locator('[data-dock-app="resume"]').click()
    await listen(page)
    await listen(page)
    // 7. Contact
    await page.locator('[data-dock-app="contact"]').click()
    await listen(page, 'bit-finale')
    await expect(page.getByText('Easter egg found: Memory restored')).toBeVisible()
    expect(await memories(page)).toEqual(['builder', 'road', 'work', 'voice', 'accident', 'record', 'purpose'])

    // The journal shows every memory, and Bit stays as a companion.
    await page.keyboard.press('Control+Space')
    await page.keyboard.type('Lost Bit')
    await page.keyboard.press('Enter')
    await expect(page.getByText('7 of 7 memories')).toBeVisible()
    await listen(page)
    if (shots) await page.screenshot({ path: `${shots}/bit-journal.png` })
    await page.getByRole('button', { name: /Bit, your guide/ }).click()
    await expect(bubble(page)).toBeVisible()
  })

  test('Bit sits on the front window and can be put away', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="arcade"]').click()
    await page.getByRole('button', { name: /Story mode/ }).click()
    await listen(page)
    await bubble(page).getByRole('button', { name: 'Maybe later' }).click()
    await listen(page)
    await expect(page.locator('[data-bit]')).toBeHidden()
    await page.getByRole('button', { name: 'Wake Bit up' }).click()
    await expect(page.locator('[data-bit]')).toBeVisible()
  })
})

test.describe('Lost Bit on iPhone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('the story starts from the home screen and the first memory works', async ({ page }) => {
    await boot(page)
    await page.getByRole('button', { name: 'Lost Bit', exact: true }).tap()
    await listen(page)
    await bubble(page).getByRole('button', { name: 'Let’s find them' }).tap()
    await listen(page)
    await page.getByRole('button', { name: 'Home', exact: true }).tap()
    await page.waitForTimeout(500)
    if (shots) await page.screenshot({ path: `${shots}/bit-iphone.png` })
    await page.getByRole('button', { name: 'About Me', exact: true }).last().tap()
    await expect(bubble(page)).toBeVisible()
    expect(await memories(page)).toEqual(['builder'])
  })
})
