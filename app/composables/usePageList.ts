/**
 * Fetches all pages for navigation.
 */
export async function usePageList(): Promise<
  { slug: string; title: string | null }[]
> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('pages')
    .select('slug, title')
    .order('slug', { ascending: true })

  if (error) throw error
  return data ?? []
}
