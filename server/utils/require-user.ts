import type { H3Event } from 'h3'

export type User = typeof auth.$Infer.Session.user

export async function requireUser(event: H3Event): Promise<User> {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })
  return session.user
}
