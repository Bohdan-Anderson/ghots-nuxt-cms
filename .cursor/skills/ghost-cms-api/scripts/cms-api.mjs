/**
 * ghots CMS edge-function client.
 * Zero dependencies — Node 20+ fetch.
 */

import fs from 'node:fs'

/** @typedef {'merge' | 'replace'} WriteMode */

/**
 * @param {string} slug
 * @returns {string}
 */
export function normalizePageSlug(slug) {
  const trimmed = slug.trim()
  if (!trimmed || trimmed === '/') return '/'
  return trimmed.startsWith('/') ? trimmed.replace(/\/+$/, '') || '/' : `/${trimmed.replace(/\/+$/, '')}`
}

/**
 * @param {unknown} data
 * @param {number} [indent=2]
 * @returns {string}
 */
export function formatJson(data, indent = 2) {
  return `${JSON.stringify(data, null, indent)}\n`
}

/**
 * @param {unknown} content
 * @param {{ email: string; password: string }} auth
 */
export function buildWritePayload(content, auth) {
  return {
    email: auth.email,
    password: auth.password,
    content,
  }
}

/**
 * @param {Record<string, string | undefined>} env
 */
export function loadConfig(env = process.env) {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const anonKey = env.ANON_KEY ?? env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY
  const email =
    env.CMS_EDITOR_EMAIL ?? env.E2E_RECIPES_EDITOR_EMAIL ?? env.E2E_EDITOR_EMAIL
  const password = env.CMS_EDITOR_PASSWORD ?? env.E2E_EDITOR_PASSWORD
  const siteKey = env.CMS_SITE_KEY

  if (!url) throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL')
  if (!anonKey) throw new Error('Missing ANON_KEY, SUPABASE_ANON_KEY, or VITE_SUPABASE_ANON_KEY')

  return { url: url.replace(/\/+$/, ''), anonKey, email, password, siteKey }
}

/**
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
export function parseEnvFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  /** @type {Record<string, string>} */
  const out = {}

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }

  return out
}

/**
 * @param {Response} res
 */
async function parseResponse(res) {
  const text = await res.text()
  /** @type {unknown} */
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!res.ok) {
    const message =
      typeof body === 'object' && body && 'error' in body
        ? String(/** @type {{ error: string }} */ (body).error)
        : typeof body === 'object' && body && 'message' in body
          ? String(/** @type {{ message: string }} */ (body).message)
          : text || res.statusText
    throw new Error(`${res.status} ${message}`)
  }

  return body
}

/**
 * @param {{ url: string; anonKey: string; email?: string; password?: string }} config
 */
export function createCmsClient(config) {
  const base = `${config.url}/functions/v1`

  /**
   * @param {string} path
   * @param {RequestInit} [init]
   */
  async function request(path, init = {}) {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${config.anonKey}`)
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(`${base}${path}`, { ...init, headers })
    return parseResponse(res)
  }

  function requireAuth() {
    if (!config.email || !config.password) {
      throw new Error('Missing CMS_EDITOR_EMAIL and CMS_EDITOR_PASSWORD for write operations')
    }
    return { email: config.email, password: config.password }
  }

  return {
    config,

    /** @param {string} siteKey */
    listPages(siteKey) {
      return request(`/cms-pages?site_key=${encodeURIComponent(siteKey)}`)
    },

    /**
     * @param {string} siteKey
     * @param {{ slug: string; templateKey: string; title?: string | null }} input
     */
    createPage(siteKey, input) {
      const auth = requireAuth()
      return request(`/cms-pages?site_key=${encodeURIComponent(siteKey)}`, {
        method: 'POST',
        body: JSON.stringify({
          ...auth,
          slug: input.slug,
          template_key: input.templateKey,
          title: input.title ?? null,
        }),
      })
    },

    /** @param {string} siteKey @param {string} pageSlug */
    deletePage(siteKey, pageSlug) {
      const auth = requireAuth()
      const slug = normalizePageSlug(pageSlug)
      return request(
        `/cms-pages?site_key=${encodeURIComponent(siteKey)}&page=${encodeURIComponent(slug)}`,
        { method: 'DELETE', body: JSON.stringify(auth) },
      )
    },

    /** @param {string} siteKey */
    listTemplates(siteKey) {
      return request(`/cms-templates?site_key=${encodeURIComponent(siteKey)}`)
    },

    /**
     * @param {string} siteKey
     * @param {{ key: string; label: string }} input
     */
    createTemplate(siteKey, input) {
      const auth = requireAuth()
      return request(`/cms-templates?site_key=${encodeURIComponent(siteKey)}`, {
        method: 'POST',
        body: JSON.stringify({ ...auth, key: input.key, label: input.label }),
      })
    },

    /** @param {string} siteKey @param {string} templateKey */
    deleteTemplate(siteKey, templateKey) {
      const auth = requireAuth()
      return request(
        `/cms-templates?site_key=${encodeURIComponent(siteKey)}&template_key=${encodeURIComponent(templateKey)}`,
        { method: 'DELETE', body: JSON.stringify(auth) },
      )
    },

    /** @param {string} siteKey @param {string} pageSlug */
    getPage(siteKey, pageSlug) {
      const slug = normalizePageSlug(pageSlug)
      return request(
        `/cms-page?site_key=${encodeURIComponent(siteKey)}&page=${encodeURIComponent(slug)}`,
      )
    },

    /**
     * @param {string} siteKey
     * @param {string} pageSlug
     * @param {unknown} content
     * @param {WriteMode} [mode='merge']
     */
    writePage(siteKey, pageSlug, content, mode = 'merge') {
      const auth = requireAuth()
      const slug = normalizePageSlug(pageSlug)
      const method = mode === 'replace' ? 'POST' : 'PUT'
      return request(
        `/cms-page?site_key=${encodeURIComponent(siteKey)}&page=${encodeURIComponent(slug)}`,
        {
          method,
          body: JSON.stringify(buildWritePayload(/** @type {never} */ (content), auth)),
        },
      )
    },
  }
}
