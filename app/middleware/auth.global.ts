import { authClient } from '~/lib/auth-client'

// M1 adds /join/[code].
const publicRoutes = ['/login', '/signup']

// Convenience only: every API route checks the session itself.
export default defineNuxtRouteMiddleware(async (to) => {
  // useFetch forwards the request's cookies during SSR, so a reload while signed in stays signed in.
  const { data: session } = await authClient.useSession(useFetch)
  const isPublic = publicRoutes.includes(to.path)

  if (!session.value && !isPublic) {
    return navigateTo(to.fullPath === '/' ? '/login' : `/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (session.value && isPublic) {
    return navigateTo(safeRedirect(to.query.redirect))
  }
})
