import { useState } from 'react'
import { Lock, Download, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { baseName, downloadBlob, bytesToBlob, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

/**
 * Browser-native PDF encryption isn't available offline, so we protect the PDF using
 * authenticated AES-GCM encryption (Web Crypto) wrapped in a small self-describing
 * container that this same tool can decrypt. This is genuinely secure, fully client-side.
 */
const MAGIC = 'SNAPPDF-ENC1'

export default function ProtectPdf() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)

  const onFile = (files: File[]) => {
    const f = files[0]
    setFile(f)
    setPassword('')
    setMode(f.name.endsWith('.snappdf') ? 'decrypt' : 'encrypt')
  }

  const deriveKey = async (pass: string, salt: BufferSource) => {
    const enc = new TextEncoder()
    const base = await crypto.subtle.importKey('raw', enc.encode(pass).buffer as ArrayBuffer, 'PBKDF2', false, ['deriveKey'])
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    )
  }

  const run = async () => {
    if (!file || !password) { toast.error('Choose a file and enter a password.'); return }
    setBusy(true)
    try {
      const buf = new Uint8Array(await fileToArrayBuffer(file))
      if (mode === 'encrypt') {
        const salt = crypto.getRandomValues(new Uint8Array(16))
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const key = await deriveKey(password, salt)
        const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buf))
        const magic = new TextEncoder().encode(MAGIC)
        const out = new Uint8Array(magic.length + 16 + 12 + cipher.length)
        out.set(magic, 0); out.set(salt, magic.length); out.set(iv, magic.length + 16); out.set(cipher, magic.length + 28)
        downloadBlob(bytesToBlob(out, 'application/octet-stream'), `${baseName(file.name)}.snappdf`)
        toast.success('PDF encrypted. Keep your password safe — it cannot be recovered.')
      } else {
        const magicLen = MAGIC.length
        const magic = new TextDecoder().decode(buf.slice(0, magicLen))
        if (magic !== MAGIC) { toast.error('Not a SnapPDF-encrypted file.'); setBusy(false); return }
        const salt = buf.slice(magicLen, magicLen + 16)
        const iv = buf.slice(magicLen + 16, magicLen + 28)
        const cipher = buf.slice(magicLen + 28)
        const key = await deriveKey(password, salt)
        const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher))
        downloadBlob(bytesToBlob(plain, 'application/pdf'), `${baseName(file.name)}-decrypted.pdf`)
        toast.success('Decrypted successfully.')
      }
      trackUsage({ toolId: 'protect-pdf', toolName: 'Protect PDF', action: mode === 'encrypt' ? 'Encrypted' : 'Decrypted', fileName: file.name, inputSize: file.size })
    } catch {
      toast.error(mode === 'decrypt' ? 'Wrong password or corrupt file.' : 'Encryption failed.')
    } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-5">
      <Dropzone accept={['application/pdf', '.snappdf']} onFiles={onFile} label="Drop a PDF to protect (or .snappdf to decrypt)" icon={<Lock className="h-8 w-8" />} />
      {file && (
        <div className="card p-5 grid gap-4">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="font-medium">{mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}: {file.name}</span>
          </div>
          <Field label="Password" hint="AES-256-GCM with PBKDF2 (150k iterations). 100% local.">
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-10" placeholder="Enter a strong password" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-300" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'} & download</button>
        </div>
      )}
      <p className="text-xs text-ink-500">Encrypted files use the <code>.snappdf</code> extension and can be decrypted here with the same password.</p>
    </div>
  )
}
