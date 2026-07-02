import { test, expect } from '@playwright/test'
import { navigateToTool, expectToolPageReady } from './helpers'

test.describe('Image Tools', () => {
  test('Resize Image - page loads', async ({ page }) => {
    await navigateToTool(page, 'resize-image')
    await expectToolPageReady(page, 'Resize Image')
  })

  test('Compress Image - page loads', async ({ page }) => {
    await navigateToTool(page, 'compress-image')
    await expectToolPageReady(page, 'Compress Image')
  })

  test('Convert Format - page loads', async ({ page }) => {
    await navigateToTool(page, 'convert-image')
    await expectToolPageReady(page, 'Convert Format')
  })

  test('Crop & Rotate - page loads', async ({ page }) => {
    await navigateToTool(page, 'crop-image')
    await expectToolPageReady(page, 'Crop & Rotate')
  })

  test('Passport Photo - page loads', async ({ page }) => {
    await navigateToTool(page, 'passport-photo')
    await expectToolPageReady(page, 'Passport Photo')
  })

  test('Image to Base64 - page loads', async ({ page }) => {
    await navigateToTool(page, 'image-to-base64')
    await expectToolPageReady(page, 'Image to Base64')
  })

  test('Remove Background - page loads', async ({ page }) => {
    await navigateToTool(page, 'remove-background')
    await expectToolPageReady(page, 'Remove Background')
  })

  test('Watermark Image - page loads', async ({ page }) => {
    await navigateToTool(page, 'watermark-image')
    await expectToolPageReady(page, 'Watermark Image')
  })

  test('Color Picker - page loads', async ({ page }) => {
    await navigateToTool(page, 'color-picker')
    await expectToolPageReady(page, 'Color Picker')
  })

  test('Image Metadata - page loads', async ({ page }) => {
    await navigateToTool(page, 'image-metadata')
    await expectToolPageReady(page, 'Image Metadata')
  })

  test('Collage Maker - page loads', async ({ page }) => {
    await navigateToTool(page, 'collage-maker')
    await expectToolPageReady(page, 'Collage Maker')
  })

  test('HEIC to JPG/PNG - page loads', async ({ page }) => {
    await navigateToTool(page, 'heic-converter')
    await expectToolPageReady(page, 'HEIC to JPG/PNG')
  })

  test('Color Palette - page loads', async ({ page }) => {
    await navigateToTool(page, 'color-palette')
    await expectToolPageReady(page, 'Color Palette')
  })

  test('Photo to Sketch - page loads', async ({ page }) => {
    await navigateToTool(page, 'photo-to-sketch')
    await expectToolPageReady(page, 'Photo to Sketch')
  })

  test('Image Border - page loads', async ({ page }) => {
    await navigateToTool(page, 'image-border')
    await expectToolPageReady(page, 'Image Border')
  })

  test('Image Metadata Editor - page loads', async ({ page }) => {
    await navigateToTool(page, 'image-exif-editor')
    await expectToolPageReady(page, 'Image Metadata Editor')
  })

  test('Meme Generator - page loads', async ({ page }) => {
    await navigateToTool(page, 'meme-generator')
    await expectToolPageReady(page, 'Meme Generator')
  })

  test('Batch Image Compressor - page loads', async ({ page }) => {
    await navigateToTool(page, 'image-compress-batch')
    await expectToolPageReady(page, 'Batch Image Compressor')
  })

  test('Background Remover AI - page loads', async ({ page }) => {
    await navigateToTool(page, 'background-remover')
    await expectToolPageReady(page, 'Background Remover')
  })

  test('Image Upscaler - page loads', async ({ page }) => {
    await navigateToTool(page, 'image-upscaler')
    await expectToolPageReady(page, 'Image Upscaler')
  })
})
