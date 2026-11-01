import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { apartments } from '../database/schema'
import { db } from '../utils/db'
import { checkMembership } from '../utils/membership'
import { addMember, createApartment, createUser } from './factories'

describe('checkMembership', () => {
  it('returns the role of an owner and of a member', async () => {
    const owner = await createUser()
    const member = await createUser()
    const apartment = await createApartment(owner.id)
    await addMember(apartment.id, member.id)

    await expect(checkMembership(owner.id, apartment.id)).resolves.toEqual({ role: 'owner' })
    await expect(checkMembership(member.id, apartment.id)).resolves.toEqual({ role: 'member' })
  })

  it('lets only an owner through when an owner is required', async () => {
    const owner = await createUser()
    const member = await createUser()
    const apartment = await createApartment(owner.id)
    await addMember(apartment.id, member.id)

    await expect(checkMembership(owner.id, apartment.id, { owner: true })).resolves.toEqual({ role: 'owner' })
    await expect(checkMembership(member.id, apartment.id, { owner: true })).rejects.toMatchObject({ statusCode: 403 })
  })

  it('refuses a user who is not a member', async () => {
    const owner = await createUser()
    const stranger = await createUser()
    const apartment = await createApartment(owner.id)

    await expect(checkMembership(stranger.id, apartment.id)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('answers an unknown apartment like one the user is not in', async () => {
    const user = await createUser()

    await expect(checkMembership(user.id, randomUUID())).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns 404 for a malformed id', async () => {
    const user = await createUser()

    await expect(checkMembership(user.id, 'not-a-uuid')).rejects.toMatchObject({ statusCode: 404 })
    await expect(checkMembership(user.id, '')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('still lets members into an archived apartment', async () => {
    const owner = await createUser()
    const apartment = await createApartment(owner.id)
    await db.update(apartments).set({ archivedAt: new Date() }).where(eq(apartments.id, apartment.id))

    await expect(checkMembership(owner.id, apartment.id)).resolves.toEqual({ role: 'owner' })
  })
})
