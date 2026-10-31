import { z } from 'zod'

export const nameSchema = z.string().trim().min(1, 'Entre 1 et 60 caractères').max(60, 'Entre 1 et 60 caractères')

// Trimmed first: a phone keyboard's trailing space must not fail the form.
const emailSchema = z.string().trim().pipe(z.email('Adresse e-mail invalide'))

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(8, '8 caractères minimum').max(128, '128 caractères maximum'),
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Saisissez votre mot de passe'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
