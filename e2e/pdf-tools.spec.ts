import { test, expect } from '@playwright/test'
import { navigateToTool, expectToolPageReady } from './helpers'

test.describe('PDF Tools', () => {
  test('Image to PDF - page loads with dropzone', async ({ page }) => {
    await navigateToTool(page, 'image-to-pdf')
    await expectToolPageReady(page, 'Image to PDF')
    await expect(page.locator('input[type="file"]')).toBeAttached()
  })

  test('PDF to Image - page loads', async ({ page }) => {
    await navigateToTool(page, 'pdf-to-image')
    await expectToolPageReady(page, 'PDF to Image')
    await expect(page.locator('input[type="file"]')).toBeAttached()
  })

  test('Compress PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'compress-pdf')
    await expectToolPageReady(page, 'Compress PDF')
  })

  test('Merge PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'merge-pdf')
    await expectToolPageReady(page, 'Merge PDF')
    await expect(page.locator('input[type="file"]')).toBeAttached()
  })

  test('Split PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'split-pdf')
    await expectToolPageReady(page, 'Split PDF')
  })

  test('Rotate PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'rotate-pdf')
    await expectToolPageReady(page, 'Rotate PDF')
  })

  test('Watermark PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'watermark-pdf')
    await expectToolPageReady(page, 'Watermark PDF')
  })

  test('Sign PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'sign-pdf')
    await expectToolPageReady(page, 'Sign PDF')
  })

  test('PDF to Text - page loads', async ({ page }) => {
    await navigateToTool(page, 'pdf-to-text')
    await expectToolPageReady(page, 'PDF to Text')
  })

  test('Page Organizer - page loads', async ({ page }) => {
    await navigateToTool(page, 'organize-pdf')
    await expectToolPageReady(page, 'Page Organizer')
  })

  test('Markdown to PDF - page loads with textarea', async ({ page }) => {
    await navigateToTool(page, 'markdown-to-pdf')
    await expectToolPageReady(page, 'Markdown to PDF')
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('Compare PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'compare-pdf')
    await expectToolPageReady(page, 'Compare PDF')
  })

  test('Unlock PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'unlock-pdf')
    await expectToolPageReady(page, 'Unlock PDF')
  })

  test('Protect PDF - page loads', async ({ page }) => {
    await navigateToTool(page, 'protect-pdf')
    await expectToolPageReady(page, 'Protect PDF')
  })

  test('Extract Images - page loads', async ({ page }) => {
    await navigateToTool(page, 'extract-images')
    await expectToolPageReady(page, 'Extract Images')
  })

  test('Delete Pages - page loads', async ({ page }) => {
    await navigateToTool(page, 'delete-pages')
    await expectToolPageReady(page, 'Delete Pages')
  })

  test('Add Page Numbers - page loads', async ({ page }) => {
    await navigateToTool(page, 'page-numbers')
    await expectToolPageReady(page, 'Add Page Numbers')
  })

  test('Extract Pages - page loads', async ({ page }) => {
    await navigateToTool(page, 'extract-pages')
    await expectToolPageReady(page, 'Extract Pages')
  })

  test('PDF Metadata - page loads', async ({ page }) => {
    await navigateToTool(page, 'pdf-metadata')
    await expectToolPageReady(page, 'PDF Metadata')
  })

  test('Page Size Converter - page loads', async ({ page }) => {
    await navigateToTool(page, 'pdf-page-size')
    await expectToolPageReady(page, 'Page Size Converter')
  })

  test('PDF Crop - page loads', async ({ page }) => {
    await navigateToTool(page, 'pdf-crop')
    await expectToolPageReady(page, 'PDF Crop')
  })

  test('PDF Bookmarks - page loads', async ({ page }) => {
    await navigateToTool(page, 'pdf-bookmarks')
    await expectToolPageReady(page, 'PDF Bookmarks')
  })

  test('PDF Annotate - page loads', async ({ page }) => {
    await navigateToTool(page, 'pdf-annotate')
    await expectToolPageReady(page, 'PDF Annotate')
  })

  test('PDF to Word - page loads', async ({ page }) => {
    await navigateToTool(page, 'pdf-to-word')
    await expectToolPageReady(page, 'PDF to Word')
  })

  test('Advanced Compression - page loads', async ({ page }) => {
    await navigateToTool(page, 'pdf-compress-advanced')
    await expectToolPageReady(page, 'Advanced Compression')
  })
})
