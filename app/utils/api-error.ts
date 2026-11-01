const fallback = 'Une erreur est survenue. Réessayez.'

// The server's French message, for a 4xx only. h3's validation 400 carries the ZodError's JSON (the forms validate with the
// same schema, so it means a stale client), a production 5xx says « Server Error », a 401 has no message.
export function apiErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) return fallback
  // A FetchError from $fetch, or the NuxtError from useFetch, which copies both fields.
  const { statusCode, data } = error as { statusCode?: number, data?: { message?: unknown, statusMessage?: unknown } }
  if (!statusCode || statusCode < 400 || statusCode >= 500) return fallback
  if (data?.statusMessage === 'Validation Error') return fallback
  return typeof data?.message === 'string' && data.message ? data.message : fallback
}
