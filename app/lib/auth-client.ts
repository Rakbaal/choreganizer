import { createAuthClient } from 'better-auth/vue'

// No baseURL: the client uses the page's origin + /api/auth, so localhost, previews and production share this file.
export const authClient = createAuthClient()
