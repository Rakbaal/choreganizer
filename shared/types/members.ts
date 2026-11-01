// role spelled out rather than Role: server/utils isn't visible from the app.
export type Member = {
  userId: string
  name: string
  role: 'owner' | 'member'
  joinedAt: string
}
