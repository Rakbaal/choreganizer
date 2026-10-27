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
})
