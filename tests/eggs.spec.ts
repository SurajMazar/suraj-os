import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 1440, height: 900 } })

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

const found = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem('surajos-eggs') ?? '{}').state?.found ?? []) as string[])

async function terminal(page: Page, line: string) {
  const input = page.getByRole('textbox', { name: 'Terminal input' })
  if (!(await input.isVisible())) await page.locator('[data-dock-app="terminal"]').click()
  await input.fill(line)
  await input.press('Enter')
}

test('the Konami code throws confetti', async ({ page }) => {
  await boot(page)
  await page.mouse.click(720, 600)
  for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await page.keyboard.press(k)
  await expect(page.locator('canvas.fixed')).toBeVisible()
  await expect(page.getByText('Easter egg found: Cheat code')).toBeVisible()
  expect(await found(page)).toContain('konami')
})

test('Spotlight does a barrel roll', async ({ page }) => {
  await boot(page)
  await page.keyboard.press('Control+Space')
  await page.keyboard.type('do a barrel roll')
  await expect(page.getByText('Easter egg found: Barrel roll')).toBeVisible()
  expect(await page.evaluate(() => document.getElementById('root')!.getAnimations().length)).toBe(1)
})

test('Terminal hides matrix, coffee, rm -rf / and the eggs list', async ({ page }) => {
  await boot(page)
  await terminal(page, 'eggs')
  await expect(page.locator('[data-terminal]')).toContainText('Easter eggs: 0 of 62 found')
  await terminal(page, 'coffee')
  await expect(page.locator('[data-terminal]')).toContainText('Brewing')
  await terminal(page, 'matrix')
  const rain = page.locator('div.fixed.bg-black canvas')
  await expect(rain).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(rain).toBeHidden()
  await terminal(page, 'rm -rf /')
  await expect(page.getByRole('alertdialog', { name: 'Pretend crash' })).toBeVisible()
  await expect(page.getByRole('alertdialog', { name: 'Pretend crash' })).toBeHidden({ timeout: 6000 })
  await terminal(page, 'eggs')
  await expect(page.locator('[data-terminal]')).toContainText('Easter eggs: 3 of 62 found')
  expect((await found(page)).sort()).toEqual(['coffee', 'matrix', 'panic'])
})

test('seven clicks on the About This Mac logo', async ({ page }) => {
  await boot(page)
  await page.getByRole('button', { name: 'System menu' }).click()
  await page.getByRole('menuitem', { name: 'About This Mac' }).click()
  const logo = page.getByRole('button', { name: 'SurajOS logo' })
  for (let i = 0; i < 4; i++) await logo.click()
  await expect(page.getByText('You are 3 steps away from being a developer.')).toBeVisible()
  for (let i = 0; i < 3; i++) await logo.click()
  await expect(page.getByText('You are now a developer. (You already were.)')).toBeVisible()
  await expect(page.getByText('Easter eggs found: 1 of 62')).toBeVisible()
})

test('opening spicy.mp4 counts as an egg', async ({ page }) => {
  await boot(page)
  await page.locator('[data-dock-app="trash"]').click()
  await page.getByRole('button', { name: 'spicy.mp4, video' }).dblclick()
  await expect(page.getByText('Easter egg found: Spicy')).toBeVisible()
})

test('every hidden Terminal command finds its egg', async ({ page }) => {
  test.slow()
  await boot(page)
  const lines = [
    'sudo hire-me',
    'momo',
    'coffee',
    'tea',
    'ping',
    'fortune',
    'flip',
    'roll',
    '8ball will it ship?',
    'weather',
    'uptime',
    'git blame',
    'git push --force',
    'make sandwich',
    'sudo make sandwich',
    'vim',
    ':q',
    'hello world',
    'npm install',
    'docker run app',
    'python',
    'namaste',
    'dalbhat',
    'everest',
    'hack',
    'sl',
    'xyzzy',
    'please',
    'party',
    'disco',
    'upside-down',
  ]
  for (const line of lines) await terminal(page, line)
  await terminal(page, 'eggs')
  const ids = [
    'hire',
    'momo',
    'coffee',
    'tea',
    'ping',
    'fortune',
    'flip',
    'roll',
    'eightball',
    'weather',
    'uptime',
    'blame',
    'force',
    'sandwich',
    'vim',
    'helloworld',
    'npm',
    'docker',
    'python',
    'namaste',
    'dalbhat',
    'everest',
    'hack',
    'train',
    'xyzzy',
    'please',
    'party',
    'disco',
    'upsidedown',
  ]
  const got = await found(page)
  for (const id of ids) expect(got, id).toContain(id)
  await expect(page.locator('[data-terminal]')).toContainText(/Easter eggs: \d+ of 62 found/)
  await expect(page.locator('[data-terminal]')).toContainText('up ')
})

test('typed words, the Trash junk and emptying the Trash', async ({ page }) => {
  await boot(page)
  await page.mouse.click(720, 600)
  await page.keyboard.type('secret')
  await expect(page.getByText('Easter egg found: Shh')).toBeVisible()
  await page.locator('[data-dock-app="trash"]').click()
  for (const name of ['node_modules', 'TODO.txt', 'untitled-folder (7)']) await page.getByRole('button', { name, exact: true }).dblclick()
  await expect(page.getByText('Inside: untitled-folder (8).')).toBeVisible()
  await page.getByRole('button', { name: 'Empty' }).click()
  const got = await found(page)
  for (const id of ['secret', 'node_modules', 'todo', 'untitled', 'cleanslate']) expect(got, id).toContain(id)
})

test('Spotlight recursion and the best developer', async ({ page }) => {
  await boot(page)
  await page.keyboard.press('Control+Space')
  await page.keyboard.type('recursion')
  await expect(page.getByRole('button', { name: 'Did you mean: recursion?' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Spotlight Search' }).fill('who is the best developer?')
  await expect(page.locator('[data-window-id]').filter({ hasText: 'Experience' }).first()).toBeVisible({ timeout: 5000 })
})
