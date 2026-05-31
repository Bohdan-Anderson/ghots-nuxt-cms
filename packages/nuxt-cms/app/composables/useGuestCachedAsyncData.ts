import type { AsyncDataOptions } from '#app'

/**
 * `useAsyncData` with static-first cache for guests only.
 * Logged-in editors bypass prerender payload and always fetch live Supabase.
 */
export function useGuestCachedAsyncData<T>(
  key: MaybeRefOrGetter<string>,
  handler: () => Promise<T>,
  options?: Omit<AsyncDataOptions<T>, 'getCachedData'>,
) {
  const { loggedIn } = useAuth()

  return useAsyncData(key, handler, {
    ...options,
    getCachedData(cacheKey, nuxtApp) {
      if (loggedIn.value) {
        return undefined
      }
      return nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey]
    },
  })
}
