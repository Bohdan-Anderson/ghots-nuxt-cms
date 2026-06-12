import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const appDir = resolve(__dirname, 'app')

export default defineConfig({
  resolve: {
    alias: {
      '#cms/registries': resolve(__dirname, 'test-utils/registries.stub.ts'),
      '~/types/cms': resolve(appDir, 'types/cms.ts'),
      '~/types/fieldValues': resolve(appDir, 'types/fieldValues.ts'),
      '~/utils/markdownToHtml': resolve(appDir, 'utils/markdownToHtml.ts'),
      '~/utils/sanitizeHtml': resolve(appDir, 'utils/sanitizeHtml.ts'),
      '~/fields/resolveField': resolve(appDir, 'fields/resolveField.ts'),
      '~/fields/maps': resolve(appDir, 'fields/maps.ts'),
      '~/fields/domContext': resolve(appDir, 'fields/domContext.ts'),
      '~/fields/fieldValues': resolve(appDir, 'fields/fieldValues.ts'),
      '~/fields/ensureField': resolve(appDir, 'fields/ensureField.ts'),
      '~/fields/syncFieldsFromDom': resolve(appDir, 'fields/syncFieldsFromDom.ts'),
      '~/fields/scanContentTree': resolve(appDir, 'fields/scanContentTree.ts'),
    },
  },
  test: {
    include: ['app/**/*.test.ts'],
    environment: 'happy-dom',
  },
})
