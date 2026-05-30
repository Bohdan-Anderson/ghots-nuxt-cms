import { createHash } from 'node:crypto'
import {
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises'
import { dirname, join } from 'node:path'

export const CMS_MEDIA_BUCKET = 'cms-media'

const CMS_MEDIA_PATH = `/storage/v1/object/public/${CMS_MEDIA_BUCKET}/`

/** Matches cms-media storage URLs (run on de-escaped content). */
const CMS_MEDIA_URL_PATTERN = new RegExp(
  `https?:\\/\\/[^"'\\s<>]+${CMS_MEDIA_PATH.replace(/\//g, '\\/')}[^"'\\s<>]+\\.(?:png|jpe?g|gif|webp|svg)`,
  'gi',
)

/**
 * Decodes JSON unicode slash escapes (`\\u002F`) for URL parsing.
 */
function decodeJsonSlashEscapes(value: string): string {
  return value.replace(/\\u002[fF]/gi, '/')
}

/**
 * Normalizes a matched URL from HTML or escaped JSON payload text.
 */
function normalizeMatchedUrl(raw: string): string {
  return decodeJsonSlashEscapes(raw.replace(/\\\//g, '/')).replace(/\\+$/, '')
}

/**
 * Returns every literal substring form to replace for one remote URL.
 */
function remoteUrlReplaceVariants(normalizedRemoteUrl: string): string[] {
  const variants = new Set<string>([normalizedRemoteUrl])

  const jsonEscaped = normalizedRemoteUrl.replace(/\//g, '\\u002F')
  variants.add(jsonEscaped)
  variants.add(jsonEscaped.replace(/\\u002F/g, '\\u002f'))

  return [...variants]
}

/**
 * Returns the storage object path from a Supabase cms-media public URL.
 */
export function cmsMediaObjectPathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const marker = CMS_MEDIA_PATH
    const index = parsed.pathname.indexOf(marker)
    if (index < 0) return null

    const objectPath = decodeURIComponent(
      parsed.pathname.slice(index + marker.length),
    )
    if (!objectPath || objectPath.includes('..')) return null
    return objectPath
  } catch {
    return null
  }
}

/**
 * Local public path served from the static deploy (`dist/cms-media/...`).
 */
export function localCmsMediaPath(objectPath: string): string {
  return `/cms-media/${objectPath}`
}

/**
 * Stable filename when the storage path contains characters unsafe on disk.
 */
function safeLocalFilename(objectPath: string): string {
  const normalized = objectPath.replace(/\\/g, '/')
  if (/^[\w./-]+$/.test(normalized)) {
    return normalized
  }
  const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 12)
  const ext = normalized.includes('.')
    ? normalized.slice(normalized.lastIndexOf('.'))
    : ''
  return `_hash/${hash}${ext}`
}

/**
 * Collects cms-media URLs from prerendered HTML or `_payload.json` text.
 * Nuxt payload JSON escapes `/` as \\u002F — decode before matching.
 */
function findCmsMediaUrls(content: string): string[] {
  const unescaped = decodeJsonSlashEscapes(content)
  const urls = new Set<string>()

  for (const match of unescaped.matchAll(CMS_MEDIA_URL_PATTERN)) {
    urls.add(normalizeMatchedUrl(match[0]))
  }

  return [...urls]
}

/**
 * Downloads a remote cms-media object into `dist/cms-media/`.
 */
async function downloadCmsMediaFile(
  distDir: string,
  remoteUrl: string,
): Promise<string | null> {
  const objectPath = cmsMediaObjectPathFromUrl(remoteUrl)
  if (!objectPath) return null

  const relativePath = safeLocalFilename(objectPath)
  const outputPath = join(distDir, 'cms-media', relativePath)
  const localUrl = localCmsMediaPath(relativePath)

  try {
    await stat(outputPath)
    return localUrl
  } catch {
    // not downloaded yet
  }

  const response = await fetch(remoteUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to download CMS image (${response.status}): ${remoteUrl}`,
    )
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, buffer)

  return localUrl
}

/**
 * Rewrites cms-media URLs in a file and downloads referenced assets.
 */
async function localizeFile(
  distDir: string,
  filePath: string,
  urlMap: Map<string, string>,
): Promise<void> {
  let content = await readFile(filePath, 'utf8')
  const urls = findCmsMediaUrls(content)
  if (urls.length === 0) return

  let changed = false

  for (const remoteUrl of urls) {
    let localUrl = urlMap.get(remoteUrl)
    if (!localUrl) {
      localUrl = await downloadCmsMediaFile(distDir, remoteUrl)
      if (!localUrl) continue
      urlMap.set(remoteUrl, localUrl)
    }

    for (const variant of remoteUrlReplaceVariants(remoteUrl)) {
      if (!content.includes(variant)) continue
      content = content.split(variant).join(localUrl)
      changed = true
    }
  }

  if (changed) {
    await writeFile(filePath, content, 'utf8')
  }
}

/**
 * Recursively walks a directory and localizes cms-media URLs in HTML + payloads.
 */
async function walkDistDir(
  distDir: string,
  currentDir: string,
  urlMap: Map<string, string>,
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'cms-media') continue
      await walkDistDir(distDir, fullPath, urlMap)
      continue
    }

    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.html') && entry.name !== '_payload.json') {
      continue
    }

    await localizeFile(distDir, fullPath, urlMap)
  }
}

/**
 * Downloads Supabase cms-media assets into `dist/cms-media/` and rewrites
 * prerendered HTML + `_payload.json` files to use local `/cms-media/` URLs.
 */
export async function localizeCmsImagesInDist(distDir: string): Promise<void> {
  const urlMap = new Map<string, string>()
  await walkDistDir(distDir, distDir, urlMap)

  if (urlMap.size > 0) {
    console.log(
      `[cms] Localized ${urlMap.size} image(s) into ${join(distDir, 'cms-media')}`,
    )
  }
}
