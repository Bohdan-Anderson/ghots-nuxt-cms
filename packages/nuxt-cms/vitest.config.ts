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
      '~/fields/defaultValues': resolve(appDir, 'fields/defaultValues.ts'),
      '~/fields/resolveField': resolve(appDir, 'fields/resolveField.ts'),
      '~/fields/resolveManifestFieldType': resolve(
        appDir,
        'fields/resolveManifestFieldType.ts',
      ),
      '~/fields/collectFieldManifest': resolve(
        appDir,
        'fields/collectFieldManifest.ts',
      ),
      '~/fields/migrateFieldValue': resolve(appDir, 'fields/migrateFieldValue.ts'),
      '~/fields/ensureField': resolve(appDir, 'fields/ensureField.ts'),
      '~/fields/syncFieldsFromManifest': resolve(
        appDir,
        'fields/syncFieldsFromManifest.ts',
      ),
    },
  },
  test: {
    include: ['app/**/*.test.ts'],
    environment: 'happy-dom',
  },
})
