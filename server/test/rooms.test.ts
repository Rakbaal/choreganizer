import { describe, expect, it } from 'vitest'
import { isUniqueViolation } from '../utils/db-errors'
import { createApartment, createRoom, createUser } from './factories'

async function duplicateError() {
  const owner = await createUser()
  const apartment = await createApartment(owner.id)
  await createRoom(apartment.id, 'Cuisine')
  return createRoom(apartment.id, 'cuisine').then(() => undefined, (error: unknown) => error)
}

describe('rooms_active_name_idx', () => {
  it('refuses a second active room with the same name in any case', async () => {
    const error = await duplicateError()

    expect(error).toBeDefined()
    expect(isUniqueViolation(error, 'rooms_active_name_idx')).toBe(true)
  })

  it('is told apart from other errors', async () => {
    const error = await duplicateError()

    expect(isUniqueViolation(error, 'tasks_active_name_idx')).toBe(false)
    expect(isUniqueViolation(new Error('x'), 'rooms_active_name_idx')).toBe(false)
    expect(isUniqueViolation(undefined, 'rooms_active_name_idx')).toBe(false)
  })

  it('lets an archived room\'s name be reused', async () => {
    const owner = await createUser()
    const apartment = await createApartment(owner.id)
    await createRoom(apartment.id, 'Cuisine', { archived: true })

    await expect(createRoom(apartment.id, 'Cuisine')).resolves.toMatchObject({ name: 'Cuisine' })
  })

  it('allows the same name in two apartments', async () => {
    const owner = await createUser()
    const first = await createApartment(owner.id)
    const second = await createApartment(owner.id)
    await createRoom(first.id, 'Cuisine')

    await expect(createRoom(second.id, 'Cuisine')).resolves.toMatchObject({ name: 'Cuisine' })
  })
})
