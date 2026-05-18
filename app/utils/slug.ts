/**
 * Normalizes a route path to a stored page slug (leading slash, no trailing slash except root).
 */
export function normalizeSlug(path: string): string {
  if (!path || path === '/') return '/'
  const withLeading = path.startsWith('/') ? path : `/${path}`
  return withLeading.replace(/\/+$/, '') || '/'
}
