// role spelled out rather than Role: server/utils isn't visible from the app.
export type Apartment = {
  id: string
  name: string
  timezone: string
  archivedAt: string | null
  role: 'owner' | 'member'
}
