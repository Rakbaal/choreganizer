import type { H3Event } from 'h3'

// apartmentId comes straight from getRouterParam: undefined fails the UUID check with a 404.
export async function requireMembership(event: H3Event, apartmentId: string | undefined, opts?: { owner?: boolean }): Promise<{ user: User, role: Role }> {
  const user = await requireUser(event)
  const { role } = await checkMembership(user.id, apartmentId ?? '', opts)
  return { user, role }
}
