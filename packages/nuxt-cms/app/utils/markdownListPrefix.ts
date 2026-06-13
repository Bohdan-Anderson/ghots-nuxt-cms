export interface MarkdownListSelection {
  value: string
  selectionStart: number
  selectionEnd: number
}

export interface MarkdownListResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

/**
 * Strips an existing markdown list marker from a line.
 */
function stripListMarker(line: string): string {
  return line.replace(/^\d+\.\s+/, '').replace(/^[-*]\s+/, '')
}

/**
 * Prefixes the line block touched by the selection as markdown list items.
 */
export function applyMarkdownListPrefix(
  input: MarkdownListSelection,
  prefixForIndex: (index: number) => string,
): MarkdownListResult {
  const { value, selectionStart: start, selectionEnd: end } = input

  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEnd = value.indexOf('\n', end)
  const blockEnd = lineEnd === -1 ? value.length : lineEnd
  const block = value.slice(lineStart, blockEnd)

  const listed = block
    .split('\n')
    .map((line, index) => {
      if (!line.trim()) return line
      return `${prefixForIndex(index)}${stripListMarker(line)}`
    })
    .join('\n')

  const nextValue = value.slice(0, lineStart) + listed + value.slice(blockEnd)
  const delta = listed.length - block.length
  const nextEnd = end + delta

  return {
    value: nextValue,
    selectionStart: start === end ? nextEnd : start,
    selectionEnd: nextEnd,
  }
}

/**
 * Applies bullet list markers to the selected line block.
 */
export function applyUnorderedListPrefix(
  input: MarkdownListSelection,
): MarkdownListResult {
  return applyMarkdownListPrefix(input, () => '- ')
}

/**
 * Applies numbered list markers to the selected line block.
 */
export function applyOrderedListPrefix(
  input: MarkdownListSelection,
): MarkdownListResult {
  return applyMarkdownListPrefix(input, (index) => `${index + 1}. `)
}
