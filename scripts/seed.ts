// Local data to click through the app: pnpm db:seed. Relative imports: tsx runs this outside Nuxt.
import { eq, inArray } from 'drizzle-orm'
import { apartments, memberships, rooms, user } from '../server/database/schema'
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
await db.delete(user).where(inArray(user.email, ['alice@example.test', 'bob@example.test']))

const alice = await createUser('Alice', 'alice@example.test')
const bob = await createUser('Bob', 'bob@example.test')

await db.insert(apartments).values({ id: SEED_APARTMENT_ID, name: 'Appartement de test' })
await db.insert(memberships).values([
  { apartmentId: SEED_APARTMENT_ID, userId: alice.id, role: 'owner' },
  { apartmentId: SEED_APARTMENT_ID, userId: bob.id, role: 'member' },
])
await db.insert(rooms).values(
  ['Cuisine', 'Salon', 'Salle de bain', 'Chambre', 'Entrée'].map((name, position) => ({ apartmentId: SEED_APARTMENT_ID, name, position })),
)

console.log(`Seeded « Appartement de test », password « ${PASSWORD} »:
  alice@example.test (owner)
  bob@example.test (member)
  rooms: Cuisine, Salon, Salle de bain, Chambre, Entrée`)
// db.ts keeps its pool open; nothing else to wait for.
process.exit(0)
