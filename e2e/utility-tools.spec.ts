import { test, expect } from '@playwright/test'
import { navigateToTool, expectToolPageReady } from './helpers'

test.describe('Utility Tools', () => {
  test('File Size Calculator - page loads', async ({ page }) => {
    await navigateToTool(page, 'file-size')
    await expectToolPageReady(page, 'File Size Calculator')
  })

  test('Document Checker - page loads', async ({ page }) => {
    await navigateToTool(page, 'document-size')
    await expectToolPageReady(page, 'Document Checker')
  })

  test('Base64 - page loads with textarea', async ({ page }) => {
    await navigateToTool(page, 'base64')
    await expectToolPageReady(page, 'Base64')
    await expect(page.locator('textarea').first()).toBeVisible()
  })

  test('Text Counter - page loads with textarea', async ({ page }) => {
    await navigateToTool(page, 'text-counter')
    await expectToolPageReady(page, 'Text Counter')
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('Hash Generator - page loads', async ({ page }) => {
    await navigateToTool(page, 'hash-generator')
    await expectToolPageReady(page, 'Hash Generator')
  })

  test('Age Calculator - page loads with date input', async ({ page }) => {
    await navigateToTool(page, 'age-calculator')
    await expectToolPageReady(page, 'Age Calculator')
  })

  test('Text to Speech - page loads with textarea and engine selector', async ({ page }) => {
    await navigateToTool(page, 'text-to-speech')
    await expectToolPageReady(page, 'Text to Speech')
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('Currency Converter - page loads with amount input', async ({ page }) => {
    await navigateToTool(page, 'currency-converter')
    await expectToolPageReady(page, 'Currency Converter')
  })

  test('Unit Converter - page loads', async ({ page }) => {
    await navigateToTool(page, 'unit-converter')
    await expectToolPageReady(page, 'Unit Converter')
  })

  test('JSON Formatter - page loads with textarea', async ({ page }) => {
    await navigateToTool(page, 'json-formatter')
    await expectToolPageReady(page, 'JSON Formatter')
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('Password Generator - page loads with controls', async ({ page }) => {
    await navigateToTool(page, 'password-generator')
    await expectToolPageReady(page, 'Password Generator')
  })

  test('Timestamp Converter - page loads', async ({ page }) => {
    await navigateToTool(page, 'timestamp-converter')
    await expectToolPageReady(page, 'Timestamp Converter')
  })

  test('Base Converter - page loads with input', async ({ page }) => {
    await navigateToTool(page, 'base-converter')
    await expectToolPageReady(page, 'Number Base Converter')
  })

  test('Lorem Ipsum - page loads with generate button', async ({ page }) => {
    await navigateToTool(page, 'lorem-ipsum')
    await expectToolPageReady(page, 'Lorem Ipsum')
  })

  test('Markdown Preview - page loads with textarea and preview', async ({ page }) => {
    await navigateToTool(page, 'markdown-preview')
    await expectToolPageReady(page, 'Markdown Preview')
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('Color Converter - page loads with color picker', async ({ page }) => {
    await navigateToTool(page, 'color-converter')
    await expectToolPageReady(page, 'Color Converter')
  })

  test('Regex Tester - page loads with input fields', async ({ page }) => {
    await navigateToTool(page, 'regex-tester')
    await expectToolPageReady(page, 'Regex Tester')
  })

  test('UUID Generator - page loads with generate button', async ({ page }) => {
    await navigateToTool(page, 'uuid-generator')
    await expectToolPageReady(page, 'UUID Generator')
  })

  test('Dice Roller - page loads with roll button', async ({ page }) => {
    await navigateToTool(page, 'dice-roller')
    await expectToolPageReady(page, 'Dice Roller')
  })

  test('Random Generator - page loads', async ({ page }) => {
    await navigateToTool(page, 'random-number')
    await expectToolPageReady(page, 'Random Generator')
  })

  test('Tip Calculator - page loads', async ({ page }) => {
    await navigateToTool(page, 'tip-calculator')
    await expectToolPageReady(page, 'Tip Calculator')
  })

  test('BMI Calculator - page loads', async ({ page }) => {
    await navigateToTool(page, 'bmi-calculator')
    await expectToolPageReady(page, 'BMI Calculator')
  })

  test('Loan/EMI Calculator - page loads with inputs', async ({ page }) => {
    await navigateToTool(page, 'loan-calculator')
    await expectToolPageReady(page, 'Loan / EMI Calculator')
    const inputs = page.locator('input[type="number"]')
    const count = await inputs.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('Roman Numeral Converter - page loads', async ({ page }) => {
    await navigateToTool(page, 'roman-numeral')
    await expectToolPageReady(page, 'Roman Numeral Converter')
  })

  test('Scientific Calculator - page loads with buttons', async ({ page }) => {
    await navigateToTool(page, 'scientific-calculator')
    await expectToolPageReady(page, 'Scientific Calculator')
  })

  test('Text Diff Checker - page loads with two textareas', async ({ page }) => {
    await navigateToTool(page, 'text-diff')
    await expectToolPageReady(page, 'Text Diff Checker')
    const textareas = page.locator('textarea')
    const count = await textareas.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('CSV Viewer - page loads', async ({ page }) => {
    await navigateToTool(page, 'csv-viewer')
    await expectToolPageReady(page, 'CSV Viewer')
  })

  test('JSON ↔ CSV Converter - page loads', async ({ page }) => {
    await navigateToTool(page, 'json-csv')
    await expectToolPageReady(page, 'JSON ↔ CSV Converter')
    await expect(page.locator('textarea').first()).toBeVisible()
  })

  test('Stopwatch & Timer - page loads with controls', async ({ page }) => {
    await navigateToTool(page, 'stopwatch')
    await expectToolPageReady(page, 'Stopwatch & Timer')
  })

  test('Cron Generator - page loads with field controls', async ({ page }) => {
    await navigateToTool(page, 'cron-generator')
    await expectToolPageReady(page, 'Cron Generator')
  })

  test('CSS Gradient Generator - page loads', async ({ page }) => {
    await navigateToTool(page, 'css-gradient-generator')
    await expectToolPageReady(page, 'CSS Gradient Generator')
  })

  test('Box Shadow Generator - page loads', async ({ page }) => {
    await navigateToTool(page, 'box-shadow-generator')
    await expectToolPageReady(page, 'Box Shadow Generator')
  })

  test('SVG to PNG - page loads', async ({ page }) => {
    await navigateToTool(page, 'svg-to-png')
    await expectToolPageReady(page, 'SVG to PNG')
  })

  test('Image to Text OCR - page loads', async ({ page }) => {
    await navigateToTool(page, 'image-ocr')
    await expectToolPageReady(page, 'Image to Text')
  })

  test('Favicon Generator - page loads', async ({ page }) => {
    await navigateToTool(page, 'favicon-generator')
    await expectToolPageReady(page, 'Favicon Generator')
  })

  test('Currency Chart - page loads', async ({ page }) => {
    await navigateToTool(page, 'currency-chart')
    await expectToolPageReady(page, 'Currency Chart')
  })

  test('Color Blindness Simulator - page loads', async ({ page }) => {
    await navigateToTool(page, 'color-blindness')
    await expectToolPageReady(page, 'Color Blindness Simulator')
  })

  test('Text to Handwriting - page loads', async ({ page }) => {
    await navigateToTool(page, 'text-to-handwriting')
    await expectToolPageReady(page, 'Text to Handwriting')
  })

  test('Heatmap Generator - page loads', async ({ page }) => {
    await navigateToTool(page, 'heatmap-generator')
    await expectToolPageReady(page, 'Heatmap Generator')
  })
})
