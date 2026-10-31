// M1 adds /join/[code].
const publicRoutes = ['/login', '/signup']

// Convenience only: every API route checks the session itself.
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await useAuthSession()
  const isPublic = publicRoutes.includes(to.path)

  if (!session.value && !isPublic) {
    return navigateTo(to.fullPath === '/' ? '/login' : `/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (session.value && isPublic) {
    return navigateTo(safeRedirect(to.query.redirect))
  }
})
