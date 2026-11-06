import { expect, test } from '@playwright/test'
test.use({ viewport: { width: 1280, height: 800 } })
test('desktop icons and widgets can be moved, and Clean Up restores them', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.waitForTimeout(1200)
  const icon = page.getByRole('option', { name: /About Me\.app/ })
  const before = (await icon.boundingBox())!
  await page.mouse.move(before.x + 50, before.y + 30)
  await page.mouse.down()
  await page.mouse.move(before.x - 200, before.y + 150, { steps: 10 })
  await page.mouse.up()
  const after = (await icon.boundingBox())!
  expect(after.x).toBeLessThan(before.x - 150)
  const widget = page.getByRole('region', { name: 'Profile' })
  const w0 = (await widget.boundingBox())!
  await page.mouse.move(w0.x + 100, w0.y + 30)
  await page.mouse.down()
  await page.mouse.move(w0.x + 400, w0.y + 200, { steps: 10 })
  await page.mouse.up()
  const w1 = (await widget.boundingBox())!
  expect(w1.x).toBeGreaterThan(w0.x + 250)
  // A drag is not a click: About Me must not have opened.
  await expect(page.locator('[data-window-id]')).toHaveCount(0)
  await page.screenshot({ path: 'test-results/drag.png' })
  // Survives reload.
  await page.reload()
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.waitForTimeout(1200)
  expect((await widget.boundingBox())!.x).toBeGreaterThan(w0.x + 250)
  await page.mouse.click(640, 400, { button: 'right' })
  await page.getByRole('menuitem', { name: 'Clean Up' }).click()
  await page.waitForTimeout(300)
  expect(Math.abs((await widget.boundingBox())!.x - w0.x)).toBeLessThan(3)
})
