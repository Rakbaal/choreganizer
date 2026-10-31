// Better Auth owns every route under /api/auth/*.
export default defineEventHandler(event => auth.handler(toWebRequest(event)))
