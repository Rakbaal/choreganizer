// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Choreganizer',
    },
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  vite: {
    // Discovered at runtime otherwise: on a cold dev server (CI's Playwright run), Vite re-bundles them on the first
    // page that needs them and reloads it mid-test.
    optimizeDeps: {
      include: ['@vueuse/integrations/useSortable', 'better-auth/vue', 'zod'],
    },
  },
})
