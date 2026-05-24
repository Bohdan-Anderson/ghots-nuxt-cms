import type { SupabaseClient } from '@supabase/supabase-js'
import { createE2eSupabase } from './supabase'
import { getE2eEnv } from './env'

/** Known baseline values for home page E2E tests. */
export const BASELINE = {
  title: 'E2E Baseline Title',
  body: 'E2E baseline body text.',
} as const

interface FieldRow {
  id: string
  page_id: string
  parent_id: string | null
  name: string
  type: string
  value: string | null
}

/**
 * Signs in as the E2E editor user.
 */
export async function signInAsEditor(
  supabase: SupabaseClient = createE2eSupabase(),
): Promise<SupabaseClient> {
  const { editorEmail, editorPassword } = getE2eEnv()
  const { error } = await supabase.auth.signInWithPassword({
    email: editorEmail,
    password: editorPassword,
  })
  if (error) throw new Error(`E2E sign-in failed: ${error.message}`)
  return supabase
}

/**
 * Resolves a field by name, optionally under a parent section name.
 */
function resolveField(
  fields: FieldRow[],
  name: string,
  parentSectionName?: string,
): FieldRow | undefined {
  if (!parentSectionName) {
    return fields.find((f) => f.name === name && f.parent_id === null)
  }

  const parent = fields.find(
    (f) =>
      f.name === parentSectionName &&
      f.type === 'section' &&
      f.parent_id === null,
  )
  if (!parent) return undefined
  return fields.find((f) => f.name === name && f.parent_id === parent.id)
}

/**
 * Seeds home page fields from the default template schema when none exist.
 */
async function seedHomePageFieldsIfEmpty(
  supabase: SupabaseClient,
  pageId: string,
): Promise<FieldRow[]> {
  const { data: existing, error: existingError } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', pageId)

  if (existingError) throw existingError
  if (existing && existing.length > 0) return existing as FieldRow[]

  const schema = [
    { name: 'title', type: 'plain_text', default: '' },
    {
      name: 'main',
      type: 'section',
      children: [{ name: 'body', type: 'plain_text', default: '' }],
    },
  ] as const

  async function insertNodes(
    nodes: readonly {
      name: string
      type: string
      default?: string
      children?: readonly { name: string; type: string; default?: string }[]
    }[],
    parentId: string | null = null,
    startOrder = 0,
  ): Promise<void> {
    let order = startOrder
    for (const node of nodes) {
      const { data: inserted, error } = await supabase
        .from('fields')
        .insert({
          page_id: pageId,
          parent_id: parentId,
          name: node.name,
          type: node.type,
          value: node.type === 'plain_text' ? (node.default ?? '') : null,
          sort_order: order++,
        })
        .select('id')
        .single()

      if (error) throw error

      if (node.type === 'section' && node.children?.length) {
        await insertNodes(node.children, inserted.id, 0)
      }
    }
  }

  await insertNodes(schema)

  const { data: refetch, error: refetchError } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', pageId)

  if (refetchError) throw refetchError
  return (refetch ?? []) as FieldRow[]
}

/**
 * Resets home page title and body fields to baseline values.
 */
export async function resetHomePageFields(): Promise<void> {
  const supabase = await signInAsEditor()

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', '/')
    .maybeSingle()

  if (pageError) throw pageError
  if (!page) throw new Error('Home page (slug /) not found in Supabase')

  const fields = await seedHomePageFieldsIfEmpty(supabase, page.id)
  const titleField = resolveField(fields, 'title')
  const bodyField = resolveField(fields, 'body', 'main')

  if (!titleField || !bodyField) {
    throw new Error('Home page title or body field not found after seed')
  }

  const updates = [
  { id: titleField.id, value: BASELINE.title },
  { id: bodyField.id, value: BASELINE.body },
  ]

  for (const { id, value } of updates) {
    const { error } = await supabase
      .from('fields')
      .update({ value })
      .eq('id', id)

    if (error) throw error
  }

  await supabase.auth.signOut()
}
