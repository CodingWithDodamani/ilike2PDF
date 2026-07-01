export type QrType = 'text' | 'url' | 'phone' | 'email' | 'sms' | 'wifi' | 'geo' | 'event' | 'vcard' | 'whatsapp'

const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')

export function buildQrData(type: QrType, f: Record<string, string>): string {
  switch (type) {
    case 'url': return f.url || ''
    case 'phone': return `tel:${f.phone || ''}`
    case 'email': return `mailto:${f.email || ''}${f.subject || f.body ? `?subject=${encodeURIComponent(f.subject || '')}&body=${encodeURIComponent(f.body || '')}` : ''}`
    case 'sms': return `SMSTO:${f.phone || ''}:${f.message || ''}`
    case 'whatsapp': return `https://wa.me/${(f.phone || '').replace(/[^0-9]/g, '')}${f.message ? `?text=${encodeURIComponent(f.message)}` : ''}`
    case 'wifi': return `WIFI:T:${f.security || 'WPA'};S:${esc(f.ssid || '')};P:${esc(f.password || '')};${f.hidden === 'true' ? 'H:true;' : ''};`
    case 'geo': {
      const lat = parseFloat(f.lat || '0')
      const lon = parseFloat(f.lon || '0')
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return ''
      return `geo:${f.lat || '0'},${f.lon || '0'}`
    }
    case 'event': return `BEGIN:VEVENT\nSUMMARY:${f.title || ''}\nLOCATION:${f.location || ''}\nDTSTART:${(f.start || '').replace(/[-:]/g, '')}\nDTEND:${(f.end || '').replace(/[-:]/g, '')}\nDESCRIPTION:${f.description || ''}\nEND:VEVENT`
    case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nN:${f.lastName || ''};${f.firstName || ''}\nFN:${f.firstName || ''} ${f.lastName || ''}\nORG:${f.org || ''}\nTITLE:${f.role || ''}\nTEL:${f.phone || ''}\nEMAIL:${f.email || ''}\nURL:${f.url || ''}\nADR:;;${f.address || ''}\nEND:VCARD`
    case 'text':
    default: return f.text || ''
  }
}

export type QrField = { key: string; label: string; type?: string; placeholder?: string; numericOnly?: boolean }

export const QR_FIELDS: Record<QrType, QrField[]> = {
  text: [{ key: 'text', label: 'Text', type: 'textarea', placeholder: 'Any text…' }],
  url: [{ key: 'url', label: 'URL', placeholder: 'https://example.com' }],
  phone: [{ key: 'phone', label: 'Phone number', type: 'tel', placeholder: '+1 555 123 4567', numericOnly: true }],
  email: [
    { key: 'email', label: 'Email', type: 'email', placeholder: 'hello@example.com' },
    { key: 'subject', label: 'Subject' },
    { key: 'body', label: 'Body', type: 'textarea' },
  ],
  sms: [{ key: 'phone', label: 'Phone', type: 'tel', numericOnly: true }, { key: 'message', label: 'Message', type: 'textarea' }],
  whatsapp: [{ key: 'phone', label: 'Phone (with country code)', type: 'tel', placeholder: '15551234567', numericOnly: true }, { key: 'message', label: 'Message', type: 'textarea' }],
  wifi: [
    { key: 'ssid', label: 'Network name (SSID)' },
    { key: 'password', label: 'Password', type: 'password' },
    { key: 'security', label: 'Security (WPA/WEP/nopass)' },
  ],
  geo: [
    { key: 'lat', label: 'Latitude', type: 'number', placeholder: 'e.g. 40.7128' },
    { key: 'lon', label: 'Longitude', type: 'number', placeholder: 'e.g. -74.0060' },
  ],
  event: [
    { key: 'title', label: 'Title' }, { key: 'location', label: 'Location' },
    { key: 'start', label: 'Start', type: 'datetime-local' }, { key: 'end', label: 'End', type: 'datetime-local' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  vcard: [
    { key: 'firstName', label: 'First name' }, { key: 'lastName', label: 'Last name' },
    { key: 'org', label: 'Organization' }, { key: 'role', label: 'Job title' },
    { key: 'phone', label: 'Phone', numericOnly: true }, { key: 'email', label: 'Email' },
    { key: 'url', label: 'Website' }, { key: 'address', label: 'Address' },
  ],
}
