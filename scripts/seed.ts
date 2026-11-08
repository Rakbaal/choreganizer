// Local data to click through the app: pnpm db:seed. Relative imports: tsx runs this outside Nuxt.
import { eq, inArray, or, sql } from 'drizzle-orm'
import { apartments, invites, memberships, rooms, taskRooms, tasks, user } from '../server/database/schema'
import { auth } from '../server/utils/auth'
import { db } from '../server/utils/db'

const SEED_APARTMENT_ID = '00000000-0000-4000-8000-000000000001'
const PASSWORD = 'choreganizer'

const { hostname } = new URL(process.env.DATABASE_URL!)
if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
  console.error(`Refusing to seed ${hostname}: db:seed only runs against a local database.`)
  process.exit(1)
}

// No request here, so Better Auth can't resolve its dynamic baseURL: the host header stands in for one (localhost:* is allowed).
const headers = new Headers({ host: 'localhost:3000' })

async function createUser(name: string, email: string) {
  const { user } = await auth.api.signUpEmail({ body: { name, email, password: PASSWORD }, headers })
  return user
}

// Cascades remove the memberships, sessions and accounts: running it twice gives the same data.
await db.delete(apartments).where(eq(apartments.id, SEED_APARTMENT_ID))
// created_by and used_by don't cascade: an invite the seed users made or used in another apartment blocks their deletion.
const seedUsers = await db.select({ id: user.id }).from(user).where(inArray(user.email, ['alice@example.test', 'bob@example.test']))
const seedUserIds = seedUsers.map(u => u.id)
await db.delete(invites).where(or(inArray(invites.createdBy, seedUserIds), inArray(invites.usedBy, seedUserIds)))
await db.delete(user).where(inArray(user.id, seedUserIds))

const alice = await createUser('Alice', 'alice@example.test')
const bob = await createUser('Bob', 'bob@example.test')

await db.insert(apartments).values({ id: SEED_APARTMENT_ID, name: 'Appartement de test' })
await db.insert(memberships).values([
  { apartmentId: SEED_APARTMENT_ID, userId: alice.id, role: 'owner' },
  { apartmentId: SEED_APARTMENT_ID, userId: bob.id, role: 'member' },
])
const seedRooms = await db.insert(rooms).values(
  ['Cuisine', 'Salon', 'Salle de bain', 'Chambre', 'Entrée'].map((name, position) => ({ apartmentId: SEED_APARTMENT_ID, name, position })),
).returning()
const seedTasks = await db.insert(tasks).values([
  { apartmentId: SEED_APARTMENT_ID, name: 'Passer le balai', allRooms: true, frequencyInterval: 1, frequencyUnit: 'week' as const, position: 0 },
  { apartmentId: SEED_APARTMENT_ID, name: 'Nettoyer les vitres', allRooms: false, frequencyInterval: 1, frequencyUnit: 'month' as const, position: 1 },
  { apartmentId: SEED_APARTMENT_ID, name: 'Sortir les poubelles', allRooms: true, position: 2 },
]).returning()
const vitres = seedTasks.find(task => task.name === 'Nettoyer les vitres')!
await db.insert(taskRooms).values(
  seedRooms.filter(room => room.name === 'Cuisine' || room.name === 'Salon').map(room => ({ taskId: vitres.id, roomId: room.id })),
)
// A fixed 12-character code, so the README can give the link.
await db.insert(invites).values({ code: 'invitedetest', apartmentId: SEED_APARTMENT_ID, createdBy: alice.id, expiresAt: sql`now() + interval '7 days'` })

console.log(`Seeded « Appartement de test », password « ${PASSWORD} »:
  alice@example.test (owner)
  bob@example.test (member)
  rooms: Cuisine, Salon, Salle de bain, Chambre, Entrée
  tasks: Passer le balai (partout, chaque semaine), Nettoyer les vitres (Cuisine, Salon, chaque mois), Sortir les poubelles (partout, au besoin)
  invite: http://localhost:3000/join/invitedetest (unused, valid 7 days)`)
// db.ts keeps its pool open; nothing else to wait for.
process.exit(0)
