import { expect, test, type Page } from '@playwright/test'

// A server-rendered page ignores clicks until Vue hydrates it: a form submitted before that is a native submit that
// reloads the page.
async function goto(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(() => {
    const nuxt = (window as unknown as { useNuxtApp?: () => { isHydrating?: boolean } }).useNuxtApp
    return nuxt?.().isHydrating === false
  })
}

// One path through the app, on a phone, as a new user: each run signs up a fresh account, so it needs no reset.
test('sign up, set up a flat and log a chore from Home', async ({ page }) => {
  const name = 'Ana'

  await goto(page, '/signup')
  await page.getByLabel('Prénom').fill(name)
  await page.getByLabel('E-mail').fill(`e2e-${crypto.randomUUID()}@example.test`)
  await page.getByLabel('Mot de passe').fill('choreganizer-e2e')
  await page.getByRole('button', { name: 'Créer mon compte' }).click()

  await expect(page).toHaveURL(/\/onboarding$/)
  await page.getByLabel('Nom de l\'appartement').fill('Appartement e2e')
  await page.getByRole('button', { name: 'Créer', exact: true }).click()

  await expect(page).toHaveURL(/\/a\/[^/]+\/settings$/)
  const home = new URL(page.url()).pathname.replace(/\/settings$/, '')
  await page.getByLabel('Nouvelle pièce').fill('Cuisine')
  await page.getByRole('button', { name: 'Ajouter' }).click()
  await expect(page.getByLabel('Nom de la pièce')).toHaveValue('Cuisine')

  // « Partout » stays on: with a single room, the task logs in one tap.
  await goto(page, `${home}/tasks/new`)
  await page.getByLabel('Nom', { exact: true }).fill('Passer le balai')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page).toHaveURL(new RegExp(`${home}/tasks$`))

  await goto(page, home)
  const task = page.getByRole('button', { name: /Passer le balai/ })
  await expect(task).toContainText('Jamais fait')
  await task.click()
  await expect(task).toContainText(`À l'instant · ${name}`)
  await expect(page.getByText('Passer le balai · noté')).toBeVisible()
})
