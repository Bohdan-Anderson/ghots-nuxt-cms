/**
 * Normalizes a route path to a stored page slug (leading slash, no trailing slash except root).
 */
export function normalizeSlug(path: string): string {
  if (!path || path === '/') return '/'
  const withLeading = path.startsWith('/') ? path : `/${path}`
  return withLeading.replace(/\/+$/, '') || '/'
}

/**
 * Converts a single path segment to a URL-safe slug fragment.
 */
function slugifySegment(segment: string): string {
  return segment
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Slugifies user input into a stored page slug (leading slash, URL-safe segments).
 */
export function slugify(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (trimmed === '/') return '/'

  const path = trimmed.replace(/^\/+/, '')
  const segments = path.split('/').map(slugifySegment).filter(Boolean)
  if (!segments.length) return ''

  return normalizeSlug(`/${segments.join('/')}`)
}

/**
 * Validates a template key (lowercase alphanumeric and hyphens).
 */
export function validateTemplateKey(key: string): string | null {
  const trimmed = key.trim().toLowerCase()
  if (!trimmed) return 'Template key is required'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
    return 'Template key must be lowercase alphanumeric with optional hyphens'
  }
  return null
}
