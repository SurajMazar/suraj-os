import { expect, test, type Page } from '@playwright/test'

const errors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const list: string[] = []
  errors.set(page, list)
  page.on('pageerror', (e) => list.push(e.message))
  page.on('console', (m) => {
    // GitHub's public API may rate-limit; that is handled in the UI, not an app error.
    if (m.type() === 'error' && !/api\.github\.com|Failed to load resource/.test(m.text())) list.push(m.text())
  })
})

test.afterEach(async ({ page }) => {
  expect(errors.get(page), 'console errors').toEqual([])
})

async function noHorizontalOverflow(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
  expect(sw, 'page must not scroll sideways').toBeLessThanOrEqual(iw)
}

/** Load SurajOS and get past the lock screen. */
async function boot(page: Page, path = '/') {
  await page.goto(path)
  await page.getByRole('button', { name: /unlock/i }).click()
  await expect(page.getByRole('dialog', { name: 'Lock Screen' })).toBeHidden()
}

const windows = (page: Page) => page.locator('[data-window-id]:not([data-closing])')

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('every Dock app opens, then quits cleanly', async ({ page }) => {
    test.slow()
    await boot(page)
    const apps = ['finder', 'about', 'projects', 'experience', 'skills', 'resume', 'terminal', 'safari', 'contact', 'settings', 'trash']
    for (const id of apps) {
      await page.locator(`[data-dock-app="${id}"]`).click()
      await expect(windows(page).last()).toBeVisible()
    }
    await expect(windows(page)).toHaveCount(apps.length)
    for (let i = 0; i < apps.length; i++) await windows(page).last().getByRole('button', { name: 'Close window' }).click()
    await expect(windows(page)).toHaveCount(0)
    await noHorizontalOverflow(page)
  })

  test('rapid clicks on a Dock icon open one window', async ({ page }) => {
    await boot(page)
    const icon = page.locator('[data-dock-app="projects"]')
    for (let i = 0; i < 8; i++) await icon.click({ delay: 0 })
    await expect(windows(page)).toHaveCount(1)
  })

  test('minimize sends a window to the Dock and restore brings it back', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="about"]').click()
    const win = windows(page).first()
    await expect(win).toBeVisible()
    await win.getByRole('button', { name: 'Minimize window' }).click()
    await expect(win).toBeHidden()
    await page.getByRole('button', { name: 'About Me', exact: true }).last().click()
    await expect(win).toBeVisible()
  })

  test('dragging moves a window, and it stays reachable after the viewport shrinks', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="terminal"]').click()
    const win = windows(page).first()
    await page.waitForTimeout(900) // let the open animation settle
    const bar = win.locator('[data-drag-region]').first()
    const b = (await bar.boundingBox())!
    await page.mouse.move(b.x + b.width / 2, b.y + 10)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width / 2 + 500, b.y + 200, { steps: 8 })
    await page.mouse.up()
    const moved = (await win.boundingBox())!
    expect(moved.x).toBeGreaterThan(b.x + 200)
    await page.setViewportSize({ width: 900, height: 700 })
    await page.waitForTimeout(400)
    const after = (await win.boundingBox())!
    expect(after.x).toBeLessThan(900 - 100)
    await noHorizontalOverflow(page)
  })

  test('Spotlight finds and opens a project', async ({ page }) => {
    await boot(page)
    await page.locator('body').click({ position: { x: 700, y: 500 } })
    await page.keyboard.press('Control+Space')
    const input = page.getByRole('textbox', { name: 'Spotlight Search' })
    await expect(input).toBeFocused()
    await input.fill('spreadsheet')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'React Spreadsheet Viewer' })).toBeVisible({ timeout: 15_000 })
  })

  test('Mission Control shows open windows and Escape closes it', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="projects"]').click()
    await page.locator('[data-dock-app="skills"]').click()
    await page.locator('body').click({ position: { x: 700, y: 860 } })
    await page.keyboard.press('Alt+ArrowUp')
    await expect(page.getByText('Mission Control', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Mission Control', { exact: true })).toBeHidden()
  })

  test('Terminal runs real commands', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="terminal"]').click()
    const input = page.getByRole('textbox', { name: 'Terminal input' })
    // The app chunk loads lazily; allow for a cold dev server.
    await expect(input).toBeFocused({ timeout: 15_000 })
    await input.fill('whoami')
    await input.press('Enter')
    await expect(page.locator('[data-terminal]')).toContainText('Senior Full Stack Engineer')
    await input.fill('nope')
    await input.press('Enter')
    await expect(page.locator('[data-terminal]')).toContainText('command not found: nope')
  })

  test('menus open, switch on hover and close on Escape', async ({ page }) => {
    await boot(page)
    await page.getByRole('button', { name: 'File' }).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await page.getByRole('button', { name: 'View' }).hover()
    await expect(page.getByRole('menuitem', { name: 'Mission Control' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toBeHidden()
  })

  test('contact form validates before sending', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="contact"]').click()
    await page.getByRole('button', { name: /Open in email app|Send message/ }).click()
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible()
  })
})

const breakpoints = [
  [320, 640],
  [375, 812],
  [390, 844],
  [430, 932],
  [844, 390],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
  [2560, 1080],
] as const

for (const [w, h] of breakpoints) {
  test(`layout holds at ${w}x${h}`, async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    await page.screenshot({ path: `test-results/screens/${w}x${h}-lock.png` })
    await noHorizontalOverflow(page)
    await page.getByRole('button', { name: /unlock/i }).click()
    await page.waitForTimeout(700)
    await noHorizontalOverflow(page)
    await page.screenshot({ path: `test-results/screens/${w}x${h}-home.png` })
    const mobile = await page.locator('[data-dock-app]').count().then((n) => n === 0)
    if (mobile) {
      await page.getByRole('button', { name: 'Projects', exact: true }).click()
    } else {
      await page.locator('[data-dock-app="projects"]').click()
      const box = (await windows(page).first().boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(w)
    }
    await page.waitForTimeout(900)
    await noHorizontalOverflow(page)
    await page.screenshot({ path: `test-results/screens/${w}x${h}-projects.png` })
  })
}

test.describe('iPhone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('apps open full screen and Back returns to the Home Screen', async ({ page }) => {
    await boot(page)
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Experience', exact: true }).tap()
    const sheet = page.getByRole('dialog', { name: 'Experience' })
    await expect(sheet).toBeVisible()
    await page.goBack()
    await expect(sheet).toBeHidden()
    await expect(page).toHaveURL(/localhost:5299\/?$/)
  })

  test('Settings drills into a section and back', async ({ page }) => {
    await boot(page)
    await page.getByRole('button', { name: 'System Settings', exact: true }).tap()
    await page.getByRole('button', { name: 'Sound' }).tap()
    await expect(page.getByText('Play sound effects')).toBeVisible()
    await page.getByRole('button', { name: 'Settings', exact: true }).tap()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('touch inputs are at least 16px so iOS does not zoom', async ({ page }) => {
    await boot(page)
    await page.getByRole('button', { name: 'Contact', exact: true }).tap()
    const size = await page.getByPlaceholder('Your name').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(size).toBeGreaterThanOrEqual(16)
  })
})

/**
 * Text that spills outside its box: a leaf text element wider than its parent
 * content box, or clipped text without an ellipsis.
 */
async function findOverflow(page: Page, scope: string) {
  return page.evaluate((scope) => {
    const issues: string[] = []
    const root = document.querySelector(scope) ?? document.body
    for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
      if (!el.childNodes.length || el.closest('[aria-hidden="true"], svg, pre, [data-terminal], .app-icon')) continue
      const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim())
      if (!hasText) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || el.getClientRects().length === 0) continue
      const parent = el.parentElement!
      const r = el.getBoundingClientRect()
      const p = parent.getBoundingClientRect()
      const pcs = getComputedStyle(parent)
      const padR = parseFloat(pcs.paddingRight) || 0
      const clipsSelf = cs.overflow !== 'visible' && el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== 'ellipsis'
      const spills = r.right > p.right - padR + 2 && pcs.overflow === 'visible' && parent.scrollWidth > parent.clientWidth + 1
      if (clipsSelf || spills) issues.push(`${el.tagName.toLowerCase()} "${el.textContent!.trim().slice(0, 40)}"`)
    }
    return issues
  }, scope)
}

test.describe('text overflow audit', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('panels and menus', async ({ page }) => {
    test.slow()
    await boot(page)
    await page.waitForTimeout(800)
    const found: string[] = []
    for (const panel of ['Control Center', 'Wi-Fi', 'Bluetooth', 'Sound', 'Battery', 'Notification Center']) {
      await page.getByRole('button', { name: panel, exact: true }).click()
      await page.waitForTimeout(350)
      found.push(...(await findOverflow(page, 'main')).map((x) => `${panel}: ${x}`))
      await page.keyboard.press('Escape')
    }
    for (const m of ['File', 'Edit', 'View', 'Window', 'Help']) {
      await page.getByRole('button', { name: m, exact: true }).click()
      found.push(...(await findOverflow(page, '[role="menu"]')).map((x) => `${m} menu: ${x}`))
      await page.keyboard.press('Escape')
    }
    expect(found).toEqual([])
  })

  for (const id of ['finder', 'about', 'projects', 'experience', 'skills', 'resume', 'terminal', 'safari', 'contact', 'arcade', 'settings', 'trash']) {
    test(`app ${id}`, async ({ page }) => {
      await boot(page)
      await page.locator(`[data-dock-app="${id}"]`).click()
      await page.waitForTimeout(1500)
      expect(await findOverflow(page, '[data-window-id]')).toEqual([])
    })
  }
})
