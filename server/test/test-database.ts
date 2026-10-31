// Never falls back to DATABASE_URL: the global setup truncates every table.
export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL is not set')
  return url
}
