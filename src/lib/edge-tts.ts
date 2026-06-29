const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const WSS_URL = 'wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1'
const VOICES_URL = 'https://api.msedgeservices.com/tts/cognitiveservices/voices/list'
const VERSION_MS_GEC = '1-142.0.3595'

export interface EdgeVoice {
  Name: string
  ShortName: string
  Gender: 'Male' | 'Female'
  Locale: string
  LocalName: string
  FriendlyName: string
  Status: string
  VoiceTag?: { ContentCategories?: string[]; VoicePersonalities?: string[] }
}

export interface EdgeTTSOptions {
  rate?: number    // -100 to +200 (percentage)
  pitch?: number   // -100 to +100 (Hz)
  volume?: number  // -100 to +100 (percentage)
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function generateToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

async function generateSecMsGec(token: string): Promise<string> {
  const now = new Date().toUTCString()
  const date = new Date(now)
  const ticks = Math.floor(date.getTime() / 1000) + 11644473600
  const rounded = ticks - (ticks % 300)
  const windowsTicks = rounded * 10_000_000

  const encoder = new TextEncoder()
  const data = encoder.encode(`${windowsTicks}${token}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function buildAuthParams(token: string, secMsGec: string): string {
  return `Ocp-Apim-Subscription-Key=${token}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${VERSION_MS_GEC}`
}

function createSSML(text: string, voice: string, rate = 0, pitch = 0, volume = 0): string {
  const pitchStr = (pitch >= 0 ? '+' : '') + pitch + 'Hz'
  const rateStr = (rate >= 0 ? '+' : '') + rate + '%'
  const volumeStr = (volume >= 0 ? '+' : '') + volume + '%'

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="${voice}">
      <prosody pitch="${pitchStr}" rate="${rateStr}" volume="${volumeStr}">
        ${escapeXml(text)}
      </prosody>
    </voice>
  </speak>`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildConfigMessage(): string {
  const timestamp = new Date().toUTCString()
  return (
    `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
    `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":true},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`
  )
}

function findInArray(arr: Uint8Array, pattern: Uint8Array): number {
  for (let i = 0; i <= arr.length - pattern.length; i++) {
    let match = true
    for (let j = 0; j < pattern.length; j++) {
      if (arr[i + j] !== pattern[j]) { match = false; break }
    }
    if (match) return i
  }
  return -1
}

let voicesCache: EdgeVoice[] | null = null

export async function getEdgeVoices(): Promise<EdgeVoice[]> {
  if (voicesCache) return voicesCache

  const token = generateToken()
  const secMsGec = await generateSecMsGec(token)
  const authParams = buildAuthParams(token, secMsGec)

  const response = await fetch(`${VOICES_URL}?${authParams}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
    },
  })

  if (!response.ok) throw new Error(`Failed to fetch voices: ${response.status}`)

  const voices: EdgeVoice[] = await response.json()
  voices.sort((a, b) => {
    if (a.Locale !== b.Locale) return a.Locale.localeCompare(b.Locale)
    return a.LocalName.localeCompare(b.LocalName)
  })

  voicesCache = voices
  return voices
}

export async function edgeTTSSynthesize(
  text: string,
  voice: string,
  options: EdgeTTSOptions = {},
): Promise<Blob> {
  const { rate = 0, pitch = 0, volume = 0 } = options

  const token = generateToken()
  const secMsGec = await generateSecMsGec(token)
  const authParams = buildAuthParams(token, secMsGec)
  const reqId = generateUUID()

  const url = `${WSS_URL}?${authParams}&ConnectionId=${reqId}`

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    const audioChunks: Uint8Array[] = []
    const needle = new TextEncoder().encode('Path:audio\r\n')
    const timeout = setTimeout(() => { ws.close(); reject(new Error('Synthesis timeout')) }, 30000)

    ws.onopen = () => {
      ws.send(buildConfigMessage())

      const ssml = createSSML(text, voice, rate, pitch, volume)
      const timestamp = new Date().toUTCString()
      const speechMessage = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${timestamp}\r\nPath:ssml\r\n\r\n${ssml}`
      ws.send(speechMessage)
    }

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) ws.close()
      } else {
        const reader = new FileReader()
        reader.onload = () => {
          const uint8Array = new Uint8Array(reader.result as ArrayBuffer)
          const audioStartIndex = findInArray(uint8Array, needle)
          if (audioStartIndex !== -1) {
            audioChunks.push(uint8Array.slice(audioStartIndex + needle.length))
          }
        }
        reader.readAsArrayBuffer(event.data)
      }
    }

    ws.onerror = () => { clearTimeout(timeout); reject(new Error('WebSocket error')) }

    ws.onclose = () => {
      clearTimeout(timeout)
      const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0)
      if (totalLength === 0) { reject(new Error('No audio data received')); return }
      const audioData = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of audioChunks) { audioData.set(chunk, offset); offset += chunk.length }
      resolve(new Blob([audioData], { type: 'audio/mpeg' }))
    }
  })
}

export function getVoicesByLocale(voices: EdgeVoice[], locale: string): EdgeVoice[] {
  return voices.filter(v => v.Locale.startsWith(locale))
}

export function getLocales(voices: EdgeVoice[]): string[] {
  return [...new Set(voices.map(v => v.Locale))].sort()
}
