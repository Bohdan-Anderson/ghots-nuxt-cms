const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'em',
  'a',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
])

/**
 * Strips disallowed tags and unsafe attributes from HTML (allowlist).
 * See docs/field-types.md for the sanitization policy.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty.trim()) return ''

  if (import.meta.server) {
    return sanitizeHtmlRegex(dirty)
  }

  const doc = new DOMParser().parseFromString(dirty, 'text/html')
  const body = doc.body

  function sanitizeNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? ''
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) {
      return Array.from(el.childNodes).map(sanitizeNode).join('')
    }

    let attrs = ''
    if (tag === 'a') {
      const href = el.getAttribute('href') ?? ''
      if (href.startsWith('http://') || href.startsWith('https://')) {
        attrs = ` href="${href.replace(/"/g, '&quot;')}"`
        if (el.getAttribute('target') === '_blank') {
          attrs += ' rel="noopener noreferrer" target="_blank"'
        }
      } else {
        return Array.from(el.childNodes).map(sanitizeNode).join('')
      }
    }

    const inner = Array.from(el.childNodes).map(sanitizeNode).join('')
    if (tag === 'br') return '<br>'
    return `<${tag}${attrs}>${inner}</${tag}>`
  }

  return Array.from(body.childNodes).map(sanitizeNode).join('')
}

/**
 * Server-side fallback when DOMParser is unavailable.
 */
function sanitizeHtmlRegex(html: string): string {
  let out = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  out = out.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  out = out.replace(/\s(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*/gi, '')
  return out
}
