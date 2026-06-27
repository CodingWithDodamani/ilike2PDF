import { lazy, type LazyExoticComponent, type ComponentType } from 'react'

type ToolComp = LazyExoticComponent<ComponentType>

export const TOOL_COMPONENTS: Record<string, ToolComp> = {
  // PDF
  'merge-pdf': lazy(() => import('./pdf/MergePdf')),
  'split-pdf': lazy(() => import('./pdf/SplitPdf')),
  'image-to-pdf': lazy(() => import('./pdf/ImageToPdf')),
  'pdf-to-image': lazy(() => import('./pdf/PdfToImage')),
  'compress-pdf': lazy(() => import('./pdf/CompressPdf')),
  'rotate-pdf': lazy(() => import('./pdf/RotatePdf')),
  'watermark-pdf': lazy(() => import('./pdf/WatermarkPdf')),
  'sign-pdf': lazy(() => import('./pdf/SignPdf')),
  'pdf-to-text': lazy(() => import('./pdf/PdfToText')),
  'organize-pdf': lazy(() => import('./pdf/OrganizePdf')),
  'markdown-to-pdf': lazy(() => import('./pdf/MarkdownToPdf')),
  'compare-pdf': lazy(() => import('./pdf/ComparePdf')),
  'unlock-pdf': lazy(() => import('./pdf/UnlockPdf')),
  'protect-pdf': lazy(() => import('./pdf/ProtectPdf')),
  'extract-images': lazy(() => import('./pdf/ExtractImages')),
  'delete-pages': lazy(() => import('./pdf/DeletePages')),
  'page-numbers': lazy(() => import('./pdf/PageNumbers')),
  'extract-pages': lazy(() => import('./pdf/ExtractPages')),
  'pdf-metadata': lazy(() => import('./pdf/PdfMetadata')),
  'pdf-page-size': lazy(() => import('./pdf/PdfPageSize')),
  // IMAGE
  'resize-image': lazy(() => import('./image/ResizeImage')),
  'compress-image': lazy(() => import('./image/CompressImage')),
  'convert-image': lazy(() => import('./image/ConvertImage')),
  'crop-image': lazy(() => import('./image/CropImage')),
  'passport-photo': lazy(() => import('./image/PassportPhoto')),
  'image-to-base64': lazy(() => import('./image/ImageToBase64')),
  'remove-background': lazy(() => import('./image/RemoveBackground')),
  'blur-background': lazy(() => import('./image/BlurImage')),
  'watermark-image': lazy(() => import('./image/WatermarkImage')),
  'color-picker': lazy(() => import('./image/ColorPicker')),
  'image-metadata': lazy(() => import('./image/ImageMetadata')),
  'collage-maker': lazy(() => import('./image/CollageMaker')),
  // QR
  'qr-generator': lazy(() => import('./qr/QrGenerator')),
  'qr-scanner': lazy(() => import('./qr/QrScanner')),
  'qr-batch': lazy(() => import('./qr/QrBatch')),
  // UTILITY
  'file-size': lazy(() => import('./utility/FileSize')),
  'document-size': lazy(() => import('./utility/DocumentSize')),
  'base64': lazy(() => import('./utility/Base64')),
  'text-counter': lazy(() => import('./utility/TextCounter')),
  'hash-generator': lazy(() => import('./utility/HashGenerator')),
}
