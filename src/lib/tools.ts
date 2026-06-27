import {
  Image, FileText, FileArchive, Combine, Scissors, RotateCw, Droplets, PenLine,
  FileType2, LayoutGrid, FileCode2, GitCompare, LockOpen, Lock, FileImage,
  FileMinus2, Hash, FileOutput, FileCog, Ruler, Maximize2, Minimize2, Repeat,
  Crop, IdCard, Binary, Eraser, Aperture, Stamp, Pipette, ScanLine, Images,
  QrCode, ScanQrCode, Grid3x3, Calculator, FileSearch, Code2, Type, Fingerprint,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ToolDef } from './types'

const IMG = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp']

export const TOOLS: ToolDef[] = [
  // ---------- PDF ----------
  { id: 'image-to-pdf', slug: 'image-to-pdf', name: 'Image to PDF', short: 'JPG/PNG → PDF', description: 'Combine images into a single PDF document with custom page size, orientation and margins.', category: 'pdf', icon: Image, accept: IMG, multiple: true, popular: true, keywords: ['jpg', 'png', 'convert', 'photo'] },
  { id: 'pdf-to-image', slug: 'pdf-to-image', name: 'PDF to Image', short: 'PDF → PNG/JPG', description: 'Render every PDF page to high-quality PNG or JPEG images and download as a ZIP.', category: 'pdf', icon: FileImage, accept: ['application/pdf'], popular: true, keywords: ['render', 'png', 'jpg', 'export'] },
  { id: 'compress-pdf', slug: 'compress-pdf', name: 'Compress PDF', short: 'Shrink file size', description: 'Reduce PDF size by re-rasterizing pages at a chosen quality. Target-size mode & analytics.', category: 'pdf', icon: FileArchive, accept: ['application/pdf'], popular: true, keywords: ['reduce', 'optimize', 'smaller'] },
  { id: 'merge-pdf', slug: 'merge-pdf', name: 'Merge PDF', short: 'Combine PDFs', description: 'Merge multiple PDFs into one. Drag to reorder, preview thumbnails, edit metadata.', category: 'pdf', icon: Combine, accept: ['application/pdf'], multiple: true, popular: true, keywords: ['combine', 'join', 'concat'] },
  { id: 'split-pdf', slug: 'split-pdf', name: 'Split PDF', short: 'Extract ranges', description: 'Split a PDF by page ranges with visual page selection and a range parser.', category: 'pdf', icon: Scissors, accept: ['application/pdf'], popular: true, keywords: ['divide', 'separate', 'range'] },
  { id: 'rotate-pdf', slug: 'rotate-pdf', name: 'Rotate PDF', short: 'Fix orientation', description: 'Rotate pages individually or in batch with live preview rendering.', category: 'pdf', icon: RotateCw, accept: ['application/pdf'], keywords: ['turn', 'orientation', 'landscape'] },
  { id: 'watermark-pdf', slug: 'watermark-pdf', name: 'Watermark PDF', short: 'Add text/image mark', description: 'Stamp text or image watermarks with opacity, rotation and position controls.', category: 'pdf', icon: Droplets, accept: ['application/pdf'], keywords: ['stamp', 'brand', 'overlay'] },
  { id: 'sign-pdf', slug: 'sign-pdf', name: 'Sign PDF', short: 'Draw/type signature', description: 'Add drawn, typed or uploaded signatures and place them on any page.', category: 'pdf', icon: PenLine, accept: ['application/pdf'], keywords: ['signature', 'esign', 'sign'] },
  { id: 'pdf-to-text', slug: 'pdf-to-text', name: 'PDF to Text', short: 'Extract text', description: 'Extract all selectable text from a PDF, page by page, ready to copy or download.', category: 'pdf', icon: FileType2, accept: ['application/pdf'], keywords: ['ocr', 'extract', 'copy'] },
  { id: 'organize-pdf', slug: 'organize-pdf', name: 'Page Organizer', short: 'Reorder pages', description: 'Reorder, rotate and remove pages on a visual thumbnail board, then rebuild the PDF.', category: 'pdf', icon: LayoutGrid, accept: ['application/pdf'], keywords: ['reorder', 'arrange', 'manage'] },
  { id: 'markdown-to-pdf', slug: 'markdown-to-pdf', name: 'Markdown to PDF', short: 'MD → PDF', description: 'Write GitHub-flavored Markdown with live preview and export a styled PDF.', category: 'pdf', icon: FileCode2, keywords: ['md', 'document', 'export'] },
  { id: 'compare-pdf', slug: 'compare-pdf', name: 'Compare PDF', short: 'Diff two PDFs', description: 'Compare two PDFs side-by-side with text diff and page-count comparison.', category: 'pdf', icon: GitCompare, accept: ['application/pdf'], multiple: true, keywords: ['diff', 'difference', 'changes'] },
  { id: 'unlock-pdf', slug: 'unlock-pdf', name: 'Unlock PDF', short: 'Remove password', description: 'Remove a known password from an encrypted PDF to create an unprotected copy.', category: 'pdf', icon: LockOpen, accept: ['application/pdf'], keywords: ['decrypt', 'password', 'open'] },
  { id: 'protect-pdf', slug: 'protect-pdf', name: 'Protect PDF', short: 'Add password', description: 'Encrypt a PDF with a user password to restrict access.', category: 'pdf', icon: Lock, accept: ['application/pdf'], keywords: ['encrypt', 'password', 'secure'] },
  { id: 'extract-images', slug: 'extract-images', name: 'Extract Images', short: 'Images from PDF', description: 'Pull embedded raster images out of a PDF and download them as a ZIP.', category: 'pdf', icon: Images, accept: ['application/pdf'], keywords: ['extract', 'pictures', 'export'] },
  { id: 'delete-pages', slug: 'delete-pages', name: 'Delete Pages', short: 'Remove pages', description: 'Select and delete specific pages from a PDF.', category: 'pdf', icon: FileMinus2, accept: ['application/pdf'], keywords: ['remove', 'trim'] },
  { id: 'page-numbers', slug: 'page-numbers', name: 'Add Page Numbers', short: 'Number pages', description: 'Add page numbers with position, format and font-size controls.', category: 'pdf', icon: Hash, accept: ['application/pdf'], keywords: ['pagination', 'footer', 'numbers'] },
  { id: 'extract-pages', slug: 'extract-pages', name: 'Extract Pages', short: 'Keep pages', description: 'Keep only the pages you select and discard the rest.', category: 'pdf', icon: FileOutput, accept: ['application/pdf'], keywords: ['keep', 'subset'] },
  { id: 'pdf-metadata', slug: 'pdf-metadata', name: 'PDF Metadata', short: 'Edit properties', description: 'View and edit PDF title, author, subject, keywords and producer.', category: 'pdf', icon: FileCog, accept: ['application/pdf'], keywords: ['properties', 'info', 'title', 'author'] },
  { id: 'pdf-page-size', slug: 'pdf-page-size', name: 'Page Size Converter', short: 'Resize pages', description: 'Convert PDF pages to A4, Letter, A3, Legal and more with scaling.', category: 'pdf', icon: Ruler, accept: ['application/pdf'], keywords: ['a4', 'letter', 'resize'] },

  // ---------- IMAGE ----------
  { id: 'resize-image', slug: 'resize-image', name: 'Resize Image', short: 'Change dimensions', description: 'Resize images by pixels or percent with aspect-ratio lock and high-quality scaling.', category: 'image', icon: Maximize2, accept: IMG, popular: true, keywords: ['scale', 'dimensions', 'pixels'] },
  { id: 'compress-image', slug: 'compress-image', name: 'Compress Image', short: 'Reduce size', description: 'Compress images with before/after slider, quality preview and preset profiles.', category: 'image', icon: Minimize2, accept: IMG, popular: true, keywords: ['optimize', 'smaller', 'quality'] },
  { id: 'convert-image', slug: 'convert-image', name: 'Convert Format', short: 'PNG/JPG/WebP', description: 'Convert between PNG, JPEG, WebP and BMP with quality control.', category: 'image', icon: Repeat, accept: IMG, popular: true, keywords: ['webp', 'png', 'jpg', 'format'] },
  { id: 'crop-image', slug: 'crop-image', name: 'Crop & Rotate', short: 'Trim & turn', description: 'Crop with free or fixed aspect ratios and rotate/flip images.', category: 'image', icon: Crop, accept: IMG, keywords: ['trim', 'cut', 'rotate', 'flip'] },
  { id: 'passport-photo', slug: 'passport-photo', name: 'Passport Photo', short: 'ID photo maker', description: 'Create compliant ID photos (Passport, Visa, Aadhaar, PAN) with guide overlays.', category: 'image', icon: IdCard, accept: IMG, keywords: ['id', 'visa', 'aadhaar', 'pan'] },
  { id: 'image-to-base64', slug: 'image-to-base64', name: 'Image to Base64', short: 'Data URI', description: 'Convert an image to a Base64 data URI for inline embedding.', category: 'image', icon: Binary, accept: IMG, keywords: ['datauri', 'encode', 'inline'] },
  { id: 'remove-background', slug: 'remove-background', name: 'Remove Background', short: 'Cut out subject', description: 'Remove solid/near-solid backgrounds with a chroma threshold and edge feathering.', category: 'image', icon: Eraser, accept: IMG, keywords: ['transparent', 'cutout', 'bg'] },
  { id: 'blur-background', slug: 'blur-background', name: 'Blur Image', short: 'Gaussian blur', description: 'Apply adjustable Gaussian blur — great for backgrounds and privacy.', category: 'image', icon: Aperture, accept: IMG, keywords: ['blur', 'soften', 'privacy'] },
  { id: 'watermark-image', slug: 'watermark-image', name: 'Watermark Image', short: 'Add text mark', description: 'Add a tiled or single text watermark with opacity and rotation.', category: 'image', icon: Stamp, accept: IMG, keywords: ['brand', 'overlay', 'copyright'] },
  { id: 'color-picker', slug: 'color-picker', name: 'Color Picker', short: 'Extract palette', description: 'Pick colors from an image and extract a dominant color palette.', category: 'image', icon: Pipette, accept: IMG, keywords: ['palette', 'eyedropper', 'hex'] },
  { id: 'image-metadata', slug: 'image-metadata', name: 'Image Metadata', short: 'View EXIF', description: 'Inspect EXIF, GPS and camera metadata embedded in your photos.', category: 'image', icon: FileSearch, accept: IMG, keywords: ['exif', 'gps', 'camera'] },
  { id: 'collage-maker', slug: 'collage-maker', name: 'Collage Maker', short: 'Photo grid', description: 'Arrange multiple photos into a grid collage with spacing and background.', category: 'image', icon: Grid3x3, accept: IMG, multiple: true, keywords: ['grid', 'montage', 'photos'] },

  // ---------- QR ----------
  { id: 'qr-generator', slug: 'qr-generator', name: 'QR Generator', short: 'Create QR codes', description: 'Generate QR codes for URL, WiFi, vCard, email, SMS, geo, events and more.', category: 'qr', icon: QrCode, popular: true, keywords: ['barcode', 'wifi', 'vcard', 'url'] },
  { id: 'qr-scanner', slug: 'qr-scanner', name: 'QR Scanner', short: 'Read QR codes', description: 'Scan QR codes from your camera or an uploaded image.', category: 'qr', icon: ScanQrCode, accept: IMG, keywords: ['read', 'decode', 'camera'] },
  { id: 'qr-batch', slug: 'qr-batch', name: 'QR Batch', short: 'Bulk generate', description: 'Generate many QR codes at once from a list and download them as a ZIP.', category: 'qr', icon: ScanLine, keywords: ['bulk', 'multiple', 'csv'] },

  // ---------- UTILITY ----------
  { id: 'file-size', slug: 'file-size', name: 'File Size Calculator', short: 'Bytes/KB/MB', description: 'Convert and calculate file sizes across units with transfer-time estimates.', category: 'utility', icon: Calculator, keywords: ['bytes', 'kb', 'mb', 'units'] },
  { id: 'document-size', slug: 'document-size', name: 'Document Checker', short: 'Inspect files', description: 'Drop any file to inspect its exact size, type and dimensions.', category: 'utility', icon: FileSearch, accept: ['*/*'], keywords: ['inspect', 'check', 'info'] },
  { id: 'base64', slug: 'base64', name: 'Base64 Encode/Decode', short: 'Text & files', description: 'Encode or decode text and files to/from Base64.', category: 'utility', icon: Code2, keywords: ['encode', 'decode', 'datauri'] },
  { id: 'text-counter', slug: 'text-counter', name: 'Text Counter', short: 'Words & chars', description: 'Count characters, words, sentences, paragraphs and reading time.', category: 'utility', icon: Type, keywords: ['word count', 'characters', 'reading time'] },
  { id: 'hash-generator', slug: 'hash-generator', name: 'Hash Generator', short: 'SHA / checksums', description: 'Generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or files.', category: 'utility', icon: Fingerprint, keywords: ['sha256', 'checksum', 'md5'] },
]

export const CATEGORY_META: Record<string, { label: string; description: string; gradient: string; icon: LucideIcon }> = {
  pdf: { label: 'PDF Tools', description: 'Merge, split, compress, convert & edit PDFs', gradient: 'from-rose-500 to-orange-500', icon: FileText },
  image: { label: 'Image Tools', description: 'Resize, compress, convert & enhance images', gradient: 'from-brand-500 to-fuchsia-500', icon: Image },
  qr: { label: 'QR Tools', description: 'Generate, scan & batch QR codes', gradient: 'from-accent-500 to-emerald-500', icon: QrCode },
  utility: { label: 'Utilities', description: 'Handy developer & file utilities', gradient: 'from-amber-500 to-yellow-400', icon: Wrench },
}

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug)
export const toolsByCategory = (cat: string) => TOOLS.filter((t) => t.category === cat)
export const popularTools = () => TOOLS.filter((t) => t.popular)
