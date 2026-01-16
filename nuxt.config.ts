import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-oidc-auth'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  oidc: {
    defaultProvider: 'auth0',
    providers: {
      auth0: {
        baseUrl: 'https://dev-gak38cfwzn71k571.eu.auth0.com/',
        clientId: process.env.NUXT_OIDC_PROVIDERS_AUTH0_CLIENT_ID,
        clientSecret: process.env.NUXT_OIDC_PROVIDERS_AUTH0_CLIENT_SECRET,
        redirectUri: 'http://localhost:3000/auth/auth0/callback',
        scope: ['openid', 'profile', 'email'],
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