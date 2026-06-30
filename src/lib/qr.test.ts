import { describe, it, expect } from 'vitest'
import { buildQrData } from './qr'

describe('buildQrData', () => {
  it('returns plain text for text type', () => {
    expect(buildQrData('text', { text: 'hello' })).toBe('hello')
  })
  it('returns empty string for text with no input', () => {
    expect(buildQrData('text', {})).toBe('')
  })
  it('returns URL directly', () => {
    expect(buildQrData('url', { url: 'https://example.com' })).toBe('https://example.com')
  })
  it('builds tel: URI for phone', () => {
    expect(buildQrData('phone', { phone: '+15551234567' })).toBe('tel:+15551234567')
  })
  it('builds mailto: URI for email', () => {
    const result = buildQrData('email', { email: 'test@example.com', subject: '', body: '' })
    expect(result).toBe('mailto:test@example.com')
  })
  it('builds mailto: with subject and body', () => {
    const result = buildQrData('email', { email: 'test@example.com', subject: 'Hi', body: 'Hello' })
    expect(result).toContain('mailto:test@example.com?subject=Hi&body=Hello')
  })
  it('builds SMSTO: URI', () => {
    expect(buildQrData('sms', { phone: '5551234', message: 'hi' })).toBe('SMSTO:5551234:hi')
  })
  it('builds WhatsApp URL', () => {
    const result = buildQrData('whatsapp', { phone: '+15551234567', message: 'hello' })
    expect(result).toContain('https://wa.me/15551234567?text=hello')
  })
  it('strips non-digits from WhatsApp phone', () => {
    const result = buildQrData('whatsapp', { phone: '+1 (555) 123-4567', message: '' })
    expect(result).toBe('https://wa.me/15551234567')
  })
  it('builds WIFI string', () => {
    const result = buildQrData('wifi', { ssid: 'MyNetwork', password: 'pass123', security: 'WPA' })
    expect(result).toBe('WIFI:T:WPA;S:MyNetwork;P:pass123;;')
  })
  it('escapes special chars in WIFI', () => {
    const result = buildQrData('wifi', { ssid: 'My,Net', password: 'p;ass', security: 'WPA' })
    expect(result).toContain('S:My\\,Net')
    expect(result).toContain('P:p\\;ass')
  })
  it('builds geo URI', () => {
    expect(buildQrData('geo', { lat: '40.7', lon: '-74.0' })).toBe('geo:40.7,-74.0')
  })
  it('builds vCard', () => {
    const result = buildQrData('vcard', {
      firstName: 'John', lastName: 'Doe', org: 'Acme', role: 'Dev',
      phone: '555', email: 'j@acme.com', url: '', address: '',
    })
    expect(result).toContain('BEGIN:VCARD')
    expect(result).toContain('VERSION:3.0')
    expect(result).toContain('N:Doe;John')
    expect(result).toContain('FN:John Doe')
    expect(result).toContain('ORG:Acme')
    expect(result).toContain('END:VCARD')
  })
  it('builds event VEVENT', () => {
    const result = buildQrData('event', {
      title: 'Meeting', location: 'Room 1',
      start: '2025-06-15T10:00', end: '2025-06-15T11:00', description: 'Sync',
    })
    expect(result).toContain('BEGIN:VEVENT')
    expect(result).toContain('SUMMARY:Meeting')
    expect(result).toContain('LOCATION:Room 1')
    expect(result).toContain('END:VEVENT')
  })
})
