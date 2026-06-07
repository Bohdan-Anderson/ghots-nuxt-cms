export type PageListEntry = { slug: string; title: string | null }

/**
 * Fetches all pages for navigation.
 */
export async function usePageList(): Promise<PageListEntry[]> {
  const supabase = useSupabase()
  const siteId = await resolveSiteId()
  const { data, error } = await supabase
    .from('pages')
    .select('slug, title')
    .eq('site_id', siteId)
    .order('slug', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * Cached nav list — prerender payload for guests, live Supabase when logged in.
 */
export function usePageListData() {
  const siteKey = useSiteKey()
  return useGuestCachedAsyncData(`page-list:${siteKey}`, () => usePageList())
}
