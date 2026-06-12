<script setup lang="ts">
import type { FieldRow, GlobalContent } from '~/types/cms'
import { fieldTypeSupportsOnPageClick } from '~/fields/registry'
import { buildFieldMaps } from '~/fields/maps'
import { syncFieldsFromDom } from '~/fields/syncFieldsFromDom'
import {
  ensureField,
  ensureInputFromElement,
} from '~/fields/ensureField'
import { resolveFieldParentContext } from '~/fields/domContext'

const props = defineProps<{
  enabled: boolean
  globalContent: GlobalContent | null
}>()

const emit = defineEmits<{
  fieldUpdated: [field: FieldRow]
}>()

const rootRef = ref<HTMLElement | null>(null)
const editor = usePageEditor()
const localContent = ref<GlobalContent | null>(null)
const syncing = ref(false)

watch(
  () => props.globalContent,
  (value) => {
    localContent.value = value
    if (value) {
      editor.registerFields(value.fieldsById, value.fieldsByParentAndName)
    }
  },
  { immediate: true },
)

function applySyncedField(row: FieldRow) {
  const current = localContent.value
  if (!current) return

  const fields = current.fields.some((f) => f.id === row.id)
    ? current.fields.map((f) => (f.id === row.id ? row : f))
    : [...current.fields, row]

  const { fieldsById, fieldsByName, fieldsByParentAndName } =
    buildFieldMaps(fields)

  localContent.value = {
    ...current,
    fields,
    fieldsById,
    fieldsByName,
    fieldsByParentAndName,
  }

  editor.registerFields(fieldsById, fieldsByParentAndName)
  emit('fieldUpdated', row)
}

async function runFieldSync() {
  if (!props.enabled || !rootRef.value || !localContent.value || syncing.value) {
    return
  }

  syncing.value = true
  try {
    const supabase = useSupabase()
    const pageContent = {
      page: { id: '' } as import('~/types/cms').PageRow,
      template: { id: '', key: '', label: '', field_schema: [] },
      fields: localContent.value.fields,
      pageFields: [],
      fieldsById: localContent.value.fieldsById,
      fieldsByName: localContent.value.fieldsByName,
      fieldsByParentAndName: localContent.value.fieldsByParentAndName,
    }

    const changed = await syncFieldsFromDom(
      supabase,
      {
        ...pageContent,
        page: { ...pageContent.page, id: localContent.value.global.id },
      },
      rootRef.value,
    )

    for (const row of changed) {
      applySyncedField(row)
    }
  } finally {
    syncing.value = false
  }
}

async function ensureFieldForElement(el: HTMLElement): Promise<FieldRow | null> {
  const current = localContent.value
  if (!current) return null

  const context = resolveFieldParentContext(el)
  const input = ensureInputFromElement(el, context)
  if (!input) return null

  syncing.value = true
  try {
    const supabase = useSupabase()
    const result = await ensureField(
      supabase,
      {
        page: { id: current.global.id } as import('~/types/cms').PageRow,
        template: { id: '', key: '', label: '', field_schema: [] },
        fields: current.fields,
        pageFields: [],
        fieldsById: current.fieldsById,
        fieldsByName: current.fieldsByName,
        fieldsByParentAndName: current.fieldsByParentAndName,
      },
      { ...input, context: { ...input.context, globalId: current.global.id } },
      current.fields,
    )
    if (result) applySyncedField(result)
    return result
  } finally {
    syncing.value = false
  }
}

async function onClick(event: MouseEvent) {
  if (!props.enabled) return

  const target = event.target as HTMLElement
  const el = target.closest('[data-name]') as HTMLElement | null
  if (!el) return

  const column = editor.editableColumnFromElement(el)
  if (!column || !fieldTypeSupportsOnPageClick(column)) return

  let field = editor.resolveFieldFromElement(el)
  if (!field) {
    field = (await ensureFieldForElement(el)) ?? null
  }
  if (!field) return

  event.preventDefault()
  editor.open(field, column)
}

let removeFieldUpdatedListener: (() => void) | null = null

onMounted(() => {
  removeFieldUpdatedListener = editor.addFieldUpdatedHandler((updated) => {
    if (!updated.global_id) return
    applySyncedField(updated)
    emit('fieldUpdated', updated)
  })
  rootRef.value?.addEventListener('click', onClick)
  void nextTick(() => runFieldSync())
})

onUnmounted(() => {
  removeFieldUpdatedListener?.()
  removeFieldUpdatedListener = null
  rootRef.value?.removeEventListener('click', onClick)
})
</script>

<template>
  <div ref="rootRef">
    <slot />
  </div>
</template>
