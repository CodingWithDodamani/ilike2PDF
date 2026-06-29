import { type Page, type Locator, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const BASE_URL = 'http://localhost:5173'

export async function navigateToTool(page: Page, slug: string) {
  await page.goto(`/tool/${slug}`)
  await page.waitForLoadState('networkidle')
}

export async function expectToolPageReady(page: Page, toolName: string) {
  await expect(page.locator('h1').first()).toContainText(toolName)
}

export async function uploadFile(page: Page, filePath: string) {
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.locator('button:has-text("Drop files here"), [class*="dropzone"], button:has-text("browse")').first().click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(filePath)
}

export async function uploadFileViaInput(page: Page, filePath: string) {
  const input = page.locator('input[type="file"]')
  await input.setInputFiles(filePath)
}

export async function expectDownload(page: Page, action: () => Promise<void>, filenamePattern?: RegExp) {
  const downloadPromise = page.waitForEvent('download')
  await action()
  const download = await downloadPromise
  if (filenamePattern) {
    expect(download.suggestedFilename()).toMatch(filenamePattern)
  }
  return download
}

export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}

export async function fillInput(page: Page, label: string, value: string) {
  const field = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") ~ input`).first()
  if (await field.isVisible()) {
    await field.clear()
    await field.fill(value)
  }
}

export async function clickButton(page: Page, text: string) {
  await page.locator(`button:has-text("${text}")`).first().click()
}

export async function waitForProcessing(page: Page, timeout = 30000) {
  await page.waitForFunction(() => {
    const spinner = document.querySelector('.animate-spin')
    return !spinner
  }, { timeout })
}

// Test fixture files
export const FIXTURES = {
  SAMPLE_PDF: path.join(__dirname, 'fixtures', 'sample.pdf'),
  SAMPLE_JPG: path.join(__dirname, 'fixtures', 'sample.jpg'),
  SAMPLE_PNG: path.join(__dirname, 'fixtures', 'sample.png'),
  SAMPLE_JSON: path.join(__dirname, 'fixtures', 'sample.json'),
  SAMPLE_CSV: path.join(__dirname, 'fixtures', 'sample.csv'),
  SAMPLE_TXT: path.join(__dirname, 'fixtures', 'sample.txt'),
}
