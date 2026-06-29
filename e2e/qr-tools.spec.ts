import { test, expect } from '@playwright/test'
import { navigateToTool, expectToolPageReady } from './helpers'

test.describe('QR Tools', () => {
  test('QR Generator - page loads with input fields', async ({ page }) => {
    await navigateToTool(page, 'qr-generator')
    await expectToolPageReady(page, 'QR Generator')
    await expect(page.locator('textarea, input[type="text"]').first()).toBeVisible()
  })

  test('QR Scanner - page loads', async ({ page }) => {
    await navigateToTool(page, 'qr-scanner')
    await expectToolPageReady(page, 'QR Scanner')
  })

  test('QR Batch - page loads with textarea', async ({ page }) => {
    await navigateToTool(page, 'qr-batch')
    await expectToolPageReady(page, 'QR Batch')
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('QR Customizer - page loads with color controls', async ({ page }) => {
    await navigateToTool(page, 'qr-customizer')
    await expectToolPageReady(page, 'QR Customizer')
    await expect(page.locator('input[type="color"]').first()).toBeVisible()
  })

  test('Barcode Generator - page loads', async ({ page }) => {
    await navigateToTool(page, 'barcode-generator')
    await expectToolPageReady(page, 'Barcode Generator')
  })

  test('WiFi QR - page loads with SSID and password fields', async ({ page }) => {
    await navigateToTool(page, 'wifi-qr')
    await expectToolPageReady(page, 'WiFi QR Code')
    await expect(page.locator('input').first()).toBeVisible()
  })

  test('vCard QR - page loads with contact fields', async ({ page }) => {
    await navigateToTool(page, 'vcard-qr')
    await expectToolPageReady(page, 'vCard QR Code')
    await expect(page.locator('input').first()).toBeVisible()
  })

  test('QR to PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'qr-to-pdf')
    await expectToolPageReady(page, 'QR to PDF')
  })

  test('QR Scanner Enhanced - page loads', async ({ page }) => {
    await navigateToTool(page, 'qr-scanner-enhanced')
    await expectToolPageReady(page, 'QR Scanner')
  })
})
