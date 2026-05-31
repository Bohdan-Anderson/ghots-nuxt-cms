export type PageListEntry = { slug: string; title: string | null }

/**
 * Fetches all pages for navigation.
 */
export async function usePageList(): Promise<PageListEntry[]> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('pages')
    .select('slug, title')
    .order('slug', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * Cached nav list — prerender payload for guests, live Supabase when logged in.
 */
export function usePageListData() {
  return useGuestCachedAsyncData('page-list', () => usePageList())
}
