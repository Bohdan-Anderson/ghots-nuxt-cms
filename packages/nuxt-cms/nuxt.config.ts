import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = fileURLToPath(new URL('.', import.meta.url))

// https://nuxt.com/docs/guide/going-further/layers
export default defineNuxtConfig({
  modules: [resolve(packageDir, 'modules/nuxt-cms')],

  css: [resolve(packageDir, 'app/assets/cms-panel.css')],

  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseAnonKey: '',
      cmsPublishWebhookUrl: '',
      cmsSiteKey: '',
    },
  },

  nitro: {
    output: {
      publicDir: 'dist',
    },
  },

  routeRules: {
    '/**': {
      prerender: true,
    },
  },
})
