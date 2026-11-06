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
}

test.describe('Arcade on the desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('opens from the Dock and lists six games', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="arcade"]').click()
    await expect(page.getByText('Take a break')).toBeVisible()
    for (const name of ['Ship It', 'Block Drop', 'Byte Snake', 'Bug Hunt', 'Stack Match', 'Type Sprint']) await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible()
    if (shots) await page.screenshot({ path: `${shots}/arcade-desktop.png` })
  })

  test('Ship It runs, jumps and collects commits', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="arcade"]').click()
    await page.getByRole('button', { name: /Ship It/ }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    // The first commits float just above the floor ahead of the start: run right and hop until one is picked up.
    await page.keyboard.down('ArrowRight')
    const course = page.getByRole('img', { name: /Ship It course/ })
    await expect
      .poll(
        async () => {
          await page.keyboard.press('Space', { delay: 120 })
          return Number((await course.getAttribute('aria-label'))!.match(/Score (\d+)/)![1])
        },
        { timeout: 10000, intervals: [150] },
      )
      .toBeGreaterThan(0)
    await page.keyboard.up('ArrowRight')
    if (shots) await page.screenshot({ path: `${shots}/shipit-desktop.png` })
    await page.keyboard.press('KeyP')
    await expect(page.getByText('Paused')).toBeVisible()
  })

  test('Block Drop moves, turns, drops and scores', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="arcade"]').click()
    await page.getByRole('button', { name: /Block Drop/ }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight')
      await page.keyboard.press('Space')
      await page.waitForTimeout(80)
    }
    const label = await page.getByRole('img', { name: /Block Drop board/ }).getAttribute('aria-label')
    expect(Number(label!.match(/Score (\d+)/)![1])).toBeGreaterThan(0)
    if (shots) await page.screenshot({ path: `${shots}/blockdrop-desktop.png` })
  })

  test('Byte Snake starts, steers, pauses and ends', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="arcade"]').click()
    await page.getByRole('button', { name: /Byte Snake/ }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(400)
    await page.keyboard.press('Space')
    await expect(page.getByText('Paused')).toBeVisible()
    await page.keyboard.press('Space')
    await expect(page.getByText('Paused')).toBeHidden()
    // Heading down from the middle row reaches the wall in about a second.
    await expect(page.getByText(/Game over|New best!/)).toBeVisible({ timeout: 4000 })
  })

  test('Bug Hunt keeps the first click safe and flags with a right-click', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="arcade"]').click()
    await page.getByRole('button', { name: /Bug Hunt/ }).click()
    const cells = page.getByRole('gridcell')
    await expect(cells).toHaveCount(81)
    await cells.nth(40).click()
    await expect(page.getByText('A bug got out')).toBeHidden()
    const open = await cells.evaluateAll((els) => els.filter((e) => e.getAttribute('aria-label') !== 'Hidden').length)
    expect(open).toBeGreaterThan(1)
    const hidden = page.getByRole('gridcell', { name: 'Hidden' }).first()
    await hidden.click({ button: 'right' })
    await expect(page.getByRole('gridcell', { name: 'Flagged' })).toHaveCount(1)
    if (shots) await page.screenshot({ path: `${shots}/bughunt-desktop.png` })
  })

  test('Stack Match can be won and records the best', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="arcade"]').click()
    await page.getByRole('button', { name: /Stack Match/ }).click()
    const cards = page.locator('button[aria-pressed]')
    await expect(cards).toHaveCount(16)
    // Look at every card once, then match the pairs.
    const labels: string[] = []
    for (let i = 0; i < 16; i += 2) {
      await cards.nth(i).click()
      labels[i] = (await cards.nth(i).getAttribute('aria-label'))!
      await cards.nth(i + 1).click()
      labels[i + 1] = (await cards.nth(i + 1).getAttribute('aria-label'))!
      await page.waitForTimeout(850)
    }
    const seen = new Set<string>()
    for (let i = 0; i < 16; i++) {
      if (seen.has(labels[i]) || (await cards.nth(i).getAttribute('aria-pressed')) === 'true') continue
      seen.add(labels[i])
      const j = labels.findIndex((l, k) => k !== i && l === labels[i])
      await cards.nth(i).click()
      await cards.nth(j).click()
      await page.waitForTimeout(150)
    }
    await expect(page.getByText(/New best!|Stack complete/)).toBeVisible()
  })

  test('Type Sprint counts typed words', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="arcade"]').click()
    await page.getByRole('button', { name: /Type Sprint/ }).click()
    const input = page.getByLabel('Type the highlighted word')
    await expect(input).toBeFocused()
    const words = page.locator('[aria-label="Words to type"] > div > span')
    for (let i = 0; i < 4; i++) await input.pressSequentially(`${await words.nth(i).textContent()} `, { delay: 20 })
    await expect(words.nth(0)).toHaveClass(/sys-green/)
    await expect(page.getByText('Accuracy').locator('..')).toContainText('100%')
    if (shots) await page.screenshot({ path: `${shots}/typesprint-desktop.png` })
  })

  test('arrow keys do not reach the game when another window is in front', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="arcade"]').click()
    await page.getByRole('button', { name: /Byte Snake/ }).click()
    await page.locator('[data-dock-app="terminal"]').click()
    await page.waitForTimeout(400)
    await page.keyboard.press('ArrowUp')
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
    await expect(page.getByText('Game over')).toBeHidden()
  })

  test('Spotlight opens a game directly', async ({ page }) => {
    await boot(page)
    await page.keyboard.press('Control+Space')
    await page.keyboard.type('bug hunt')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('gridcell').first()).toBeVisible()
  })
})

test.describe('Arcade on iPhone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  for (const game of ['Ship It', 'Block Drop', 'Byte Snake', 'Bug Hunt', 'Stack Match', 'Type Sprint']) {
    test(`${game} fits the screen`, async ({ page }) => {
      await boot(page)
      await page.waitForTimeout(300)
      await page.getByRole('button', { name: 'Arcade', exact: true }).tap()
      const sheet = page.getByRole('dialog', { name: 'Arcade' })
      await expect(sheet).toBeVisible()
      await sheet.getByRole('button', { name: new RegExp(game) }).tap()
      await page.waitForTimeout(700)
      if (game === 'Ship It') await expect(page.getByRole('button', { name: 'Jump' })).toBeVisible()
      if (game === 'Block Drop') await expect(page.getByRole('button', { name: 'Turn' })).toBeVisible()
      if (game === 'Byte Snake') await expect(page.getByRole('button', { name: 'Turn up' })).toBeVisible()
      if (game === 'Bug Hunt') await expect(page.getByRole('radio', { name: 'Flag' })).toBeVisible()
      // Nothing in the game runs past the edges of the phone.
      const out = await sheet.evaluate((root) =>
        [...root.querySelectorAll<HTMLElement>('canvas, [role=grid], button, input')]
          .filter((el) => el.offsetParent)
          .map((el) => ({ el: el.getAttribute('aria-label') ?? el.tagName, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.left < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1)
          .map(({ el }) => el),
      )
      expect(out).toEqual([])
      if (shots) await page.screenshot({ path: `${shots}/${game.replace(' ', '-').toLowerCase()}-iphone.png` })
    })
  }
})
