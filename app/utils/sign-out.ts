import { authClient } from '~/lib/auth-client'

export async function signOut() {
  await authClient.signOut()
  // Refetch the cached session, or the middleware still sees the user and sends /login back here.
  await refreshNuxtData()
  await navigateTo('/login')
}
