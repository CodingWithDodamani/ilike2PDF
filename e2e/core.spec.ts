import { test, expect } from '@playwright/test'
import { navigateToTool, expectToolPageReady } from './helpers'

test.describe('Core Navigation', () => {
  test('homepage loads with all sections', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('PDF essentials')
    await expect(page.locator('#tools')).toBeVisible()
    await expect(page.locator('h3:has-text("PDF Tools")')).toBeVisible()
    await expect(page.locator('h3:has-text("Image Tools")')).toBeVisible()
    await expect(page.locator('h3:has-text("QR Tools")')).toBeVisible()
    await expect(page.locator('h3:has-text("Utilities")')).toBeVisible()
  })

  test('homepage shows tool cards', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('[class*="card-hover"]')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThan(10)
  })

  test('category page loads for each category', async ({ page }) => {
    for (const cat of ['pdf', 'image', 'qr', 'utility']) {
      await page.goto(`/category/${cat}`)
      await expect(page.locator('h1')).toBeVisible()
      const toolCards = page.locator('[class*="card-hover"]')
      await expect(toolCards.first()).toBeVisible()
    }
  })

  test('search filters tools on category page', async ({ page }) => {
    await page.goto('/category/utility')
    const searchInput = page.locator('input[aria-label="Search tools"]')
    await searchInput.fill('json')
    await page.waitForTimeout(300)
    const cards = page.locator('[class*="card-hover"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(34)
  })

  test('tool page renders with breadcrumb, title, description', async ({ page }) => {
    await navigateToTool(page, 'merge-pdf')
    await expectToolPageReady(page, 'Merge PDF')
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible()
    await expect(page.locator('text=Home').first()).toBeVisible()
    await expect(page.locator('text=100% Private').first()).toBeVisible()
  })

  test('all tool slugs are reachable', async ({ page }) => {
    test.slow()
    const slugs = [
      'image-to-pdf', 'pdf-to-image', 'compress-pdf', 'merge-pdf', 'split-pdf',
      'rotate-pdf', 'watermark-pdf', 'sign-pdf', 'pdf-to-text', 'organize-pdf',
      'resize-image', 'compress-image', 'convert-image', 'crop-image',
      'qr-generator', 'qr-scanner', 'qr-batch', 'qr-customizer', 'barcode-generator',
      'file-size', 'base64', 'text-counter', 'hash-generator', 'json-formatter',
      'password-generator', 'timestamp-converter', 'base-converter', 'uuid-generator',
      'currency-converter', 'unit-converter', 'age-calculator', 'text-to-speech',
      'lorem-ipsum', 'markdown-preview', 'color-converter', 'regex-tester',
      'dice-roller', 'random-number', 'tip-calculator', 'bmi-calculator',
      'loan-calculator', 'roman-numeral', 'scientific-calculator',
      'json-csv', 'stopwatch', 'cron-generator', 'wifi-qr', 'vcard-qr', 'qr-to-pdf',
      'meme-generator', 'background-remover', 'image-upscaler', 'image-exif-editor', 'image-compress-batch',
      'pdf-crop', 'pdf-bookmarks', 'pdf-annotate', 'pdf-to-word', 'pdf-compress-advanced',
      'heic-converter', 'text-diff', 'color-palette', 'photo-to-sketch', 'csv-viewer', 'qr-scanner-enhanced',
      'css-gradient-generator', 'box-shadow-generator', 'svg-to-png', 'image-ocr', 'favicon-generator', 'image-border',
    ]
    for (const slug of slugs) {
      await page.goto(`/tool/${slug}`, { timeout: 60000 })
      await page.waitForLoadState('domcontentloaded')
      const heading = page.locator('h1').first()
      await expect(heading).toBeVisible({ timeout: 30000 })
    }
  })
})
