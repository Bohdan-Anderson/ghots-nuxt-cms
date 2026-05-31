import type { SupabaseClient } from '@supabase/supabase-js'
import {
  resolveField,
  seedFieldsFromSchema,
  type FieldSchemaNode,
} from '../../../packages/nuxt-cms/test-utils/e2e'
import { createE2eSupabase } from './supabase'
import {
  assertSupabaseReachable,
  getE2eEnv,
  isTransientNetworkError,
} from './env'

/** Known baseline values for home page E2E tests. */
export const BASELINE = {
  title: 'E2E Baseline Title',
  body: 'E2E baseline body text.',
} as const

/** Known baseline values for /demo page (migration 002 seed). */
export const DEMO_BASELINE = {
  pageTitle: 'Slice demo page',
  firstHeroHeadline: 'First hero headline',
  secondHeroHeadline: 'Second hero headline',
  metaTitle: 'Slice demo — ghots-cms',
  navLabel: 'My Site',
  ctaLinkLabel: 'Learn more',
  ctaRichTextSnippet: 'Welcome to our',
  teamHeading: 'Our team',
  teamMemberName: 'Alex Example',
} as const

interface FieldRow {
  id: string
  page_id: string
  slice_id: string | null
  parent_id: string | null
  name: string
  type: string
  value: string | null
}

/**
 * Waits between transient network retries.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const SIGN_IN_MAX_ATTEMPTS = 3
const SIGN_IN_RETRY_MS = 1500

/**
 * Signs in as the E2E editor user.
 */
export async function signInAsEditor(
  supabase: SupabaseClient = createE2eSupabase(),
): Promise<SupabaseClient> {
  const { editorEmail, editorPassword, supabaseUrl } = getE2eEnv()
  await assertSupabaseReachable(supabaseUrl)

  let lastMessage = 'unknown error'

  for (let attempt = 1; attempt <= SIGN_IN_MAX_ATTEMPTS; attempt++) {
    const { error } = await supabase.auth.signInWithPassword({
      email: editorEmail,
      password: editorPassword,
    })

    if (!error) return supabase

    lastMessage = error.message

    if (
      attempt < SIGN_IN_MAX_ATTEMPTS &&
      isTransientNetworkError(error.message)
    ) {
      await sleep(SIGN_IN_RETRY_MS * attempt)
      continue
    }

    break
  }

  const host = new URL(supabaseUrl).host
  throw new Error(
    `E2E sign-in failed: ${lastMessage}. ` +
      `Supabase host: ${host}. ` +
      'Check E2E_EDITOR_EMAIL / E2E_EDITOR_PASSWORD and that the Auth user exists.',
  )
}

const HOME_PAGE_SCHEMA: FieldSchemaNode[] = [
  { name: 'title', type: 'plain_text', default: '' },
  {
    name: 'main',
    type: 'section',
    children: [{ name: 'body', type: 'plain_text', default: '' }],
  },
]

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

  await seedFieldsFromSchema(supabase, HOME_PAGE_SCHEMA, { pageId })

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

/**
 * Resets /demo page title and hero slice headlines to migration seed values.
 */
export async function resetDemoPageFields(): Promise<void> {
  const supabase = await signInAsEditor()

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', '/demo')
    .maybeSingle()

  if (pageError) throw pageError
  if (!page) {
    await supabase.auth.signOut()
    return
  }

  const { data: slices, error: slicesError } = await supabase
    .from('page_slices')
    .select('id, sort_order')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true })

  if (slicesError) throw slicesError

  const { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('id, name, slice_id, parent_id')
    .eq('page_id', page.id)

  if (fieldsError) throw fieldsError

  const fieldList = (fields ?? []) as FieldRow[]
  const titleField = fieldList.find(
    (field) => field.name === 'title' && field.slice_id === null,
  )

  if (!titleField) {
    throw new Error('Demo page title field not found')
  }

  const headlineBaselines = [
    DEMO_BASELINE.firstHeroHeadline,
    DEMO_BASELINE.secondHeroHeadline,
  ] as const

  const updates: { id: string; value: string }[] = [
    { id: titleField.id, value: DEMO_BASELINE.pageTitle },
  ]

  for (let index = 0; index < (slices?.length ?? 0); index++) {
    const slice = slices![index]
    const headline = headlineBaselines[index]
    if (!slice || !headline) continue

    const headlineField = fieldList.find(
      (field) => field.slice_id === slice.id && field.name === 'headline',
    )
    if (!headlineField) {
      throw new Error(`Demo hero headline field not found for slice ${slice.id}`)
    }
    updates.push({ id: headlineField.id, value: headline })
  }

  const ctaSlice = slices?.find((slice) => {
    const sliceFields = fieldList.filter((field) => field.slice_id === slice.id)
    return sliceFields.some((field) => field.name === 'cta_link')
  })

  if (ctaSlice) {
    const linkField = fieldList.find(
      (field) => field.slice_id === ctaSlice.id && field.name === 'cta_link',
    )
    const copyField = fieldList.find(
      (field) => field.slice_id === ctaSlice.id && field.name === 'copy',
    )

    if (linkField) {
      updates.push({
        id: linkField.id,
        value: JSON.stringify({
          url: 'https://example.com',
          label: DEMO_BASELINE.ctaLinkLabel,
          target: '_blank',
        }),
      })
    }

    if (copyField) {
      updates.push({
        id: copyField.id,
        value: JSON.stringify({
          source: 'Welcome to our **demo**.',
          html: '<p>Welcome to our <strong>demo</strong>.</p>',
        }),
      })
    }
  }

  const teamSlice = slices?.find((slice) => {
    const sliceFields = fieldList.filter((field) => field.slice_id === slice.id)
    return sliceFields.some((field) => field.name === 'members')
  })

  if (teamSlice) {
    const { data: teamFields, error: teamFieldsError } = await supabase
      .from('fields')
      .select('id, name, type, parent_id, value')
      .eq('slice_id', teamSlice.id)

    if (teamFieldsError) throw teamFieldsError

    const teamFieldList = (teamFields ?? []) as FieldRow[]
    const headingField = teamFieldList.find(
      (field) => field.name === 'heading' && field.type === 'plain_text',
    )
    if (headingField) {
      updates.push({
        id: headingField.id,
        value: DEMO_BASELINE.teamHeading,
      })
    }

    const membersArray = teamFieldList.find((field) => field.name === 'members')
    if (membersArray) {
      const extraItems = teamFieldList.filter(
        (field) =>
          field.parent_id === membersArray.id &&
          field.type === 'section' &&
          field.name !== 'item_0',
      )
      for (const item of extraItems) {
        const { error: deleteError } = await supabase
          .from('fields')
          .delete()
          .eq('id', item.id)
        if (deleteError) throw deleteError
      }

      const itemZero = teamFieldList.find(
        (field) =>
          field.parent_id === membersArray.id && field.name === 'item_0',
      )
      if (itemZero) {
        const nameField = teamFieldList.find(
          (field) => field.parent_id === itemZero.id && field.name === 'name',
        )
        const photoField = teamFieldList.find(
          (field) => field.parent_id === itemZero.id && field.name === 'photo',
        )
        if (nameField) {
          updates.push({
            id: nameField.id,
            value: DEMO_BASELINE.teamMemberName,
          })
        }
        if (photoField) {
          updates.push({
            id: photoField.id,
            value: JSON.stringify({
              url: '',
              alt: DEMO_BASELINE.teamMemberName,
            }),
          })
        }
      }
    }
  }

  for (const { id, value } of updates) {
    const { error } = await supabase
      .from('fields')
      .update({ value })
      .eq('id', id)

    if (error) throw error
  }

  await supabase.auth.signOut()
}

/**
 * Resets all E2E baseline pages (home + demo) before/after a test run.
 */
export async function resetE2eBaselines(): Promise<void> {
  await resetHomePageFields()
  await resetDemoPageFields()
}
