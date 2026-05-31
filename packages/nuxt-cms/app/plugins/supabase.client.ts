import type { User } from '@supabase/supabase-js'

/**
 * Restores the Supabase session on load and keeps auth state in sync.
 */
export default defineNuxtPlugin(async () => {
  const supabase = useSupabase()
  const user = useState<User | null>('auth-user', () => null)

  const {
    data: { session },
  } = await supabase.auth.getSession()
  user.value = session?.user ?? null

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })
})
