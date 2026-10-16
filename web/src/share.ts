import { toBlob } from 'html-to-image'

export async function renderCardImage(el: HTMLElement, filename: string): Promise<File> {
  const blob = await toBlob(el, {
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: true,
    backgroundColor: getComputedStyle(el).backgroundColor,
  })
  if (!blob) throw new Error('Could not render image')
  return new File([blob], filename, { type: 'image/png' })
}

function download(file: File): 'downloaded' {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}

// Must be called directly from a click handler (iOS Safari requires a user gesture),
// so render the File ahead of time with renderCardImage.
export async function shareFile(file: File): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled'
      return download(file)
    }
  }
  return download(file)
}
