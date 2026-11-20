import { describe, expect, it } from 'vitest'
import { isTrustedApplicationUrl } from '../src/shared/ipc-security'

describe('IPC sender validation', () => {
  it('allows only the local Vite origin in development', () => {
    expect(isTrustedApplicationUrl('http://localhost:5173/', false)).toBe(true)
    expect(isTrustedApplicationUrl('http://127.0.0.1:5173/src/', false)).toBe(true)
    for (const url of ['http://localhost.evil:5173/','https://localhost:5173/','file:///index.html','data:text/html,x']) expect(isTrustedApplicationUrl(url,false)).toBe(false)
  })
  it('allows only the exact packaged renderer URL', () => {
    expect(isTrustedApplicationUrl('file:///app/out/renderer/index.html',true,'file:///app/out/renderer/index.html')).toBe(true)
    expect(isTrustedApplicationUrl('file:///app/other.html',true,'file:///app/out/renderer/index.html')).toBe(false)
  })
})
