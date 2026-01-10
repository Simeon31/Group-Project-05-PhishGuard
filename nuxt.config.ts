import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-oidc-auth'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  oidc: {
    defaultProvider: 'auth0',
    providers: {
      auth0: {
        baseUrl: process.env.NUXT_OIDC_PROVIDERS_AUTH0_BASE_URL,
        clientId: process.env.NUXT_OIDC_PROVIDERS_AUTH0_CLIENT_ID,
        clientSecret: process.env.NUXT_OIDC_PROVIDERS_AUTH0_CLIENT_SECRET,
        redirectUri: process.env.NUXT_OIDC_REDIRECT_URI,
        skipAccessTokenParsing: true,
        validateAccessToken: false,
      }
    },
    middleware: {
      globalMiddlewareEnabled: false,
      redirect: false,
    },
    devMode: {
      enabled: false,
      userName: 'Test User'
    }
  }
})