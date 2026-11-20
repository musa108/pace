export function isTrustedApplicationUrl(url: string, packaged: boolean, expectedFileUrl?: string): boolean {
  if (packaged) return typeof expectedFileUrl === 'string' && url === expectedFileUrl
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' && (parsed.origin === 'http://localhost:5173' || parsed.origin === 'http://127.0.0.1:5173')
  } catch { return false }
}
