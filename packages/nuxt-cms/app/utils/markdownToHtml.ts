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
 * Applies inline markdown (bold, italic, links) to already-escaped text.
 */
function applyInlineFormatting(line: string): string {
  let result = escapeHtml(line)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
  result = result.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2">$1</a>',
  )
  return result
}

/**
 * Returns non-empty lines from a markdown block.
 */
function blockLines(block: string): string[] {
  return block.trim().split('\n').filter((line) => line.trim())
}

/**
 * Returns true when every line in the block is an unordered list item.
 */
function isUnorderedListBlock(block: string): boolean {
  const lines = blockLines(block)
  return lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line))
}

/**
 * Returns true when every line in the block is an ordered list item.
 */
function isOrderedListBlock(block: string): boolean {
  const lines = blockLines(block)
  return lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line))
}

/**
 * Renders a paragraph block, preserving single line breaks as `<br>`.
 */
function renderParagraph(block: string): string {
  const lines = block.trim().split('\n')
  let html = applyInlineFormatting(lines[0] ?? '')
  for (let i = 1; i < lines.length; i++) {
    html += `<br>${applyInlineFormatting(lines[i])}`
  }
  return `<p>${html}</p>`
}

/**
 * Renders an unordered list block.
 */
function renderUnorderedList(block: string): string {
  const items = blockLines(block).map((line) => {
    const content = line.replace(/^[-*]\s+/, '')
    return `<li>${applyInlineFormatting(content)}</li>`
  })
  return `<ul>${items.join('')}</ul>`
}

/**
 * Renders an ordered list block.
 */
function renderOrderedList(block: string): string {
  const items = blockLines(block).map((line) => {
    const content = line.replace(/^\d+\.\s+/, '')
    return `<li>${applyInlineFormatting(content)}</li>`
  })
  return `<ol>${items.join('')}</ol>`
}

/**
 * Converts a small markdown subset to HTML (paragraphs, bold, italic, links, lists).
 * Used when saving richtext fields; output is sanitized before storage.
 */
export function markdownToHtml(source: string): string {
  const trimmed = source.trim()
  if (!trimmed) return ''

  const blocks = trimmed.split(/\n\n+/)

  return blocks
    .map((block) => {
      if (isUnorderedListBlock(block)) return renderUnorderedList(block)
      if (isOrderedListBlock(block)) return renderOrderedList(block)
      return renderParagraph(block)
    })
    .join('')
}
