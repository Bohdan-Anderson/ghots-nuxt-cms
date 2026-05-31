/**
 * Escapes text for safe HTML insertion.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Converts a small markdown subset to HTML (paragraphs, bold, italic, links).
 * Used when saving richtext fields; output is sanitized before storage.
 */
export function markdownToHtml(source: string): string {
  const trimmed = source.trim()
  if (!trimmed) return ''

  const blocks = trimmed.split(/\n\n+/)

  return blocks
    .map((block) => {
      let line = escapeHtml(block.trim())
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      line = line.replace(/\*(.+?)\*/g, '<em>$1</em>')
      line = line.replace(
        /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2">$1</a>',
      )
      line = line.replace(/\n/g, '<br>')
      return `<p>${line}</p>`
    })
    .join('')
}
