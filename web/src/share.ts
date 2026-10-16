import { toBlob } from 'html-to-image'

export async function renderCardImage(el: HTMLElement, filename: string): Promise<File> {
  const blob = await toBlob(el, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: getComputedStyle(el).backgroundColor,
  })
  if (!blob) throw new Error('Could not render image')
  return new File([blob], filename, { type: 'image/png' })
}

// Must be called directly from a click handler (iOS Safari requires a user gesture),
// so render the File ahead of time with renderCardImage.
export async function shareFile(file: File, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return 'shared'
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled'
      throw e
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
