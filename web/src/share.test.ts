import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shareFile } from './share'

const file = new File(['x'], 'fast.png', { type: 'image/png' })

function stubNav(canShare: unknown, share: unknown) {
  Object.defineProperty(navigator, 'canShare', { value: canShare, configurable: true, writable: true })
  Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true })
}

describe('shareFile', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    stubNav(undefined, undefined)
  })

  it('returns shared when share succeeds', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNav(() => true, share)
    expect(await shareFile(file, 'hi')).toBe('shared')
    expect(share).toHaveBeenCalledOnce()
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('returns cancelled on AbortError without downloading', async () => {
    stubNav(() => true, vi.fn().mockRejectedValue(new DOMException('no', 'AbortError')))
    expect(await shareFile(file, 'hi')).toBe('cancelled')
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('falls back to download on other share errors', async () => {
    stubNav(() => true, vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError')))
    expect(await shareFile(file, 'hi')).toBe('downloaded')
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('downloads when canShare is unavailable', async () => {
    stubNav(undefined, undefined)
    expect(await shareFile(file, 'hi')).toBe('downloaded')
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('downloads when canShare returns false', async () => {
    const share = vi.fn()
    stubNav(() => false, share)
    expect(await shareFile(file, 'hi')).toBe('downloaded')
    expect(share).not.toHaveBeenCalled()
  })
})
