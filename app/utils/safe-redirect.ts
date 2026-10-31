// Only same-site paths: `//host` and `/\host` (read as `//host` by browsers) would leave the app.
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/'
  if (value.startsWith('//') || value.startsWith('/\\')) return '/'
  return value
}
