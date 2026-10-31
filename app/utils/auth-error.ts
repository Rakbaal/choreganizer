const messages: Record<string, string> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Un compte existe déjà avec cet e-mail.',
  INVALID_EMAIL_OR_PASSWORD: 'E-mail ou mot de passe incorrect.',
  PASSWORD_TOO_SHORT: 'Le mot de passe doit faire au moins 8 caractères.',
  INVALID_NAME: 'Le prénom doit faire entre 1 et 60 caractères.',
}

export function authErrorMessage(error: { code?: string, status?: number }): string {
  if (error.code && messages[error.code]) return messages[error.code]!
  // Better Auth's rate limiter answers 429 without a code.
  if (error.status === 429) return 'Trop de tentatives. Réessayez dans quelques secondes.'
  return 'Une erreur est survenue. Réessayez.'
}
