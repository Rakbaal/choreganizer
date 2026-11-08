import { feedQuerySchema } from '#shared/schemas/logs'

export default defineEventHandler(async (event): Promise<LogPage> => {
  const id = getRouterParam(event, 'id')
  // Any member, archived apartment included.
  await requireMembership(event, id)
  const filters = await getValidatedQuery(event, feedQuerySchema.parse)
  const [page, people] = await Promise.all([listLogs(id!, filters), logAuthors(id!)])
  return { ...page, people }
})
