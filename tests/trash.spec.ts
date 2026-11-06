import { expect, test, type Page } from '@playwright/test'

const shots = process.env.ARCADE_SHOTS

async function boot(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /unlock/i }).click()
  await expect(page.getByRole('dialog', { name: 'Lock Screen' })).toBeHidden()
}

test.describe('the video in the Trash', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('double-clicking spicy.mp4 opens it in the Video app', async ({ page }) => {
    await boot(page)
    await page.locator('[data-dock-app="trash"]').click()
    const file = page.getByRole('button', { name: 'spicy.mp4, video' })
    await expect(file).toBeVisible()
    // One click selects, like Finder; it takes a double-click to open.
    await file.click()
    await expect(page.locator('iframe[title="spicy.mp4"]')).toHaveCount(0)
    await file.dblclick()
    const video = page.locator('iframe[title="spicy.mp4"]')
    await expect(video).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?autoplay=1/)
    await expect(video).toHaveAttribute('allow', /autoplay/)
    if (shots) {
      await page.waitForTimeout(2500)
      await page.screenshot({ path: `${shots}/spicy.png` })
    }
  })
})

test.describe('the video in the Trash on iPhone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('a tap opens it', async ({ page }) => {
    await boot(page)
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Trash', exact: true }).tap()
    await page.getByRole('button', { name: 'spicy.mp4, video' }).tap()
    await expect(page.getByRole('dialog', { name: 'spicy.mp4' })).toBeVisible()
    await expect(page.locator('iframe[title="spicy.mp4"]')).toBeVisible()
  })
})
