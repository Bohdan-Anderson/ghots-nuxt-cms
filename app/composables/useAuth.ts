import type { User } from '@supabase/supabase-js'

/**
 * Supabase auth session state and sign-in / sign-out helpers.
 */
export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const supabase = useSupabase()

  const loggedIn = computed(() => !!user.value)

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, loggedIn, signIn, signOut }
}
