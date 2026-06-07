import type { SiteRow } from '~/types/cms'

/**
 * Returns the configured site key for this deployment (server-trusted config, not client input).
 */
export function useSiteKey(): string {
  const config = useRuntimeConfig()
  return config.public.cmsSiteKey
}

/**
 * Resolves a site key to its database row.
 */
export async function fetchSiteByKey(siteKey: string): Promise<SiteRow> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('key', siteKey)
    .single()

  if (error) throw error
  return data as SiteRow
}

/**
 * Resolves the configured deployment site to its database id.
 */
export async function resolveSiteId(): Promise<string> {
  const site = await fetchSiteByKey(useSiteKey())
  return site.id
}

/**
 * Returns the configured site id or throws if the site row is missing.
 */
export async function requireSiteId(): Promise<string> {
  return resolveSiteId()
}

/**
 * Cached site row for the configured deployment site key.
 */
export function useSite() {
  const siteKey = computed(() => useSiteKey())

  const { data: site, refresh } = useAsyncData(
    () => `site:${siteKey.value}`,
    () => fetchSiteByKey(siteKey.value),
  )

  const siteId = computed(() => site.value?.id ?? null)

  return {
    siteKey,
    site,
    siteId,
    refreshSite: refresh,
  }
}
