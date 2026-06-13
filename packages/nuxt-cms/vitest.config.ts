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
      '~/fields/pageContent': resolve(appDir, 'fields/pageContent.ts'),
      '~/fields/ensureField': resolve(appDir, 'fields/ensureField.ts'),
      '~/fields/syncFieldsFromDom': resolve(
        appDir,
        'fields/syncFieldsFromDom.ts',
      ),
      '~/fields/scanContentTree': resolve(appDir, 'fields/scanContentTree.ts'),
      '~/fields/registry': resolve(appDir, 'fields/registry.ts'),
      '~/composables/useCmsField': resolve(
        appDir,
        'composables/useCmsField.ts',
      ),
      '~/composables/usePageEditor': resolve(
        appDir,
        'composables/usePageEditor.ts',
      ),
      '~/composables/useCmsFieldSync': resolve(
        appDir,
        'composables/useCmsFieldSync.ts',
      ),
      '~/composables/seedFields': resolve(appDir, 'composables/seedFields.ts'),
      '~/composables/usePageContent': resolve(
        appDir,
        'composables/usePageContent.ts',
      ),
      '~/components/field-edit/FieldEditPlainText.vue': resolve(
        __dirname,
        'test-utils/vue-component-stub.ts',
      ),
      '~/components/field-edit/FieldEditLink.vue': resolve(
        __dirname,
        'test-utils/vue-component-stub.ts',
      ),
      '~/components/field-edit/FieldEditRichText.vue': resolve(
        __dirname,
        'test-utils/vue-component-stub.ts',
      ),
      '~/components/field-edit/FieldEditImage.vue': resolve(
        __dirname,
        'test-utils/vue-component-stub.ts',
      ),
    },
  },
  test: {
    include: ['app/**/*.test.ts'],
    environment: 'happy-dom',
    setupFiles: [resolve(__dirname, 'test-utils/vitest.setup.ts')],
  },
})
