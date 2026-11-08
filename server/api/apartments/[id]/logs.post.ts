import { logSchema } from '#shared/schemas/logs'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  // Any member, archived apartment included.
  const { user } = await requireMembership(event, id)
  const body = await readValidatedBody(event, logSchema.parse)
  const entry = await createLog(body, { apartmentId: id!, userId: user.id })
  setResponseStatus(event, 201)
  return entry
})
