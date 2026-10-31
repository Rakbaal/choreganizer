import type { authClient } from '~/lib/auth-client'

type Session = typeof authClient.$Infer.Session

// Not authClient.useSession(useFetch): on the server Better Auth's client falls back to VERCEL_URL, a deployment URL
// behind Vercel's login, so SSR got an HTML page instead of the session. A relative path is answered in-process,
// with the request's cookies.
export function useAuthSession() {
  return useFetch<Session | null>('/api/auth/get-session', { key: 'auth-session' })
}
