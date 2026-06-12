import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveField, type FieldRow } from '../../../packages/nuxt-cms/test-utils/e2e'
import { createE2eSupabase, createE2eServiceSupabase } from './supabase'
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

/** Known baseline values for /demo page. */
export const DEMO_BASELINE = {
  pageTitle: 'Sections demo page',
  firstHeroHeadline: 'First hero headline',
  secondHeroHeadline: 'Second hero headline',
  metaTitle: 'Sections demo — ghots-cms',
  navLabel: 'My Site',
  ctaLinkLabel: 'Learn more',
  ctaRichTextSnippet: 'Welcome to our',
  teamHeading: 'Our team',
  teamMemberName: 'Alex Example',
} as const

/**
 * Waits between transient network retries.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const SIGN_IN_MAX_ATTEMPTS = 3
const SIGN_IN_RETRY_MS = 1500

/**
 * Resolves the E2E deployment site id from the sites table.
 */
async function resolveE2eSiteId(supabase: SupabaseClient): Promise<string> {
  const { cmsSiteKey } = getE2eEnv()
  const { data, error } = await supabase
    .from('sites')
    .select('id')
    .eq('key', cmsSiteKey)
    .single()

  if (error) throw error
  return data.id as string
}

/**
 * Ensures the signed-in editor is a member of the configured site.
 */
async function ensureEditorSiteMembership(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { supabaseServiceRoleKey } = getE2eEnv()
  if (!supabaseServiceRoleKey) return

  const siteId = await resolveE2eSiteId(supabase)
  const serviceSupabase = createE2eServiceSupabase()

  const { error } = await serviceSupabase.from('site_members').upsert(
    { site_id: siteId, user_id: userId },
    { onConflict: 'site_id,user_id' },
  )

  if (error) throw error
}

/**
 * Signs in as the E2E editor user and links them to the configured site.
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

    if (!error) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('E2E sign-in succeeded but no user session')

      await ensureEditorSiteMembership(supabase, user.id)
      return supabase
    }

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

/**
 * Seeds home page fields when none exist (wide-row model).
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

  const { data: mainSection, error: mainError } = await supabase
    .from('fields')
    .insert({
      page_id: pageId,
      parent_id: null,
      name: 'main',
      kind: 'section',
      sort_order: 1,
    })
    .select('*')
    .single()

  if (mainError) throw mainError

  const { error: fieldsError } = await supabase.from('fields').insert([
    {
      page_id: pageId,
      parent_id: null,
      name: 'title',
      plain_text: '',
      sort_order: 0,
    },
    {
      page_id: pageId,
      parent_id: mainSection.id,
      name: 'body',
      plain_text: '',
      sort_order: 0,
    },
  ])

  if (fieldsError) throw fieldsError

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
  const siteId = await resolveE2eSiteId(supabase)

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', '/')
    .maybeSingle()

  if (pageError) throw pageError
  if (!page) throw new Error('Home page (slug /) not found in Supabase')

  const fields = await seedHomePageFieldsIfEmpty(supabase, page.id)
  const mainSection = fields.find(
    (field) => field.name === 'main' && field.kind === 'section',
  )
  const titleField = resolveField(fields, 'title')
  const bodyField = mainSection
    ? resolveField(fields, 'body', mainSection.id)
    : undefined
  const subtitleField = resolveField(fields, 'subtitle')

  if (!titleField || !bodyField) {
    throw new Error('Home page title or body field not found after seed')
  }

  if (subtitleField) {
    const { error: deleteSubtitleError } = await supabase
      .from('fields')
      .delete()
      .eq('id', subtitleField.id)

    if (deleteSubtitleError) throw deleteSubtitleError
  }

  const updates = [
    { id: titleField.id, plain_text: BASELINE.title },
    { id: bodyField.id, plain_text: BASELINE.body },
  ]

  for (const { id, plain_text } of updates) {
    const { error } = await supabase
      .from('fields')
      .update({ plain_text })
      .eq('id', id)

    if (error) throw error
  }

  await supabase.auth.signOut()
}

/**
 * Deletes a root-level home page field row by name if it exists.
 */
export async function deleteHomePageRootField(name: string): Promise<void> {
  const supabase = await signInAsEditor()
  const siteId = await resolveE2eSiteId(supabase)

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', '/')
    .maybeSingle()

  if (pageError) throw pageError
  if (!page) {
    await supabase.auth.signOut()
    return
  }

  const { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', page.id)

  if (fieldsError) throw fieldsError

  const field = resolveField((fields ?? []) as FieldRow[], name)
  if (field) {
    const { error } = await supabase.from('fields').delete().eq('id', field.id)
    if (error) throw error
  }

  await supabase.auth.signOut()
}

/**
 * Returns a root-level home page field row by name, or null when missing.
 */
export async function getHomePageRootField(
  name: string,
): Promise<FieldRow | null> {
  const supabase = await signInAsEditor()
  const siteId = await resolveE2eSiteId(supabase)

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', '/')
    .maybeSingle()

  if (pageError) throw pageError
  if (!page) {
    await supabase.auth.signOut()
    return null
  }

  const { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', page.id)

  if (fieldsError) throw fieldsError

  const field = resolveField((fields ?? []) as FieldRow[], name)
  await supabase.auth.signOut()
  return field ?? null
}

/**
 * Finds a section field by name at page root.
 */
function findSection(
  fields: FieldRow[],
  name: string,
): FieldRow | undefined {
  return fields.find(
    (field) =>
      field.name === name && field.kind === 'section' && field.parent_id === null,
  )
}

/**
 * Resets /demo page fields to migration seed values.
 */
export async function resetDemoPageFields(): Promise<void> {
  const supabase = await signInAsEditor()
  const siteId = await resolveE2eSiteId(supabase)

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', '/demo')
    .maybeSingle()

  if (pageError) throw pageError
  if (!page) {
    await supabase.auth.signOut()
    return
  }

  const { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', page.id)

  if (fieldsError) throw fieldsError

  const fieldList = (fields ?? []) as FieldRow[]
  const titleField = resolveField(fieldList, 'title')

  if (!titleField) {
    throw new Error('Demo page title field not found')
  }

  const { error: pageMetaError } = await supabase
    .from('pages')
    .update({
      title: DEMO_BASELINE.pageTitle,
      meta_title: DEMO_BASELINE.metaTitle,
    })
    .eq('id', page.id)

  if (pageMetaError) throw pageMetaError

  const updates: { id: string; patch: Record<string, string> }[] = [
    { id: titleField.id, patch: { plain_text: DEMO_BASELINE.pageTitle } },
  ]

  const heroSections = ['hero1', 'hero2'] as const
  const headlines = [
    DEMO_BASELINE.firstHeroHeadline,
    DEMO_BASELINE.secondHeroHeadline,
  ] as const

  for (let index = 0; index < heroSections.length; index++) {
    const section = findSection(fieldList, heroSections[index]!)
    const headline = headlines[index]
    if (!section || !headline) continue

    const headlineField = resolveField(fieldList, 'headline', section.id)
    if (!headlineField) {
      throw new Error(`Demo hero headline not found for ${heroSections[index]}`)
    }
    updates.push({ id: headlineField.id, patch: { plain_text: headline } })
  }

  const ctaSection = findSection(fieldList, 'cta')
  if (ctaSection) {
    const linkField = resolveField(fieldList, 'cta_link', ctaSection.id)
    const copyField = resolveField(fieldList, 'copy', ctaSection.id)

    if (linkField) {
      updates.push({
        id: linkField.id,
        patch: {
          link: JSON.stringify({
            url: 'https://example.com',
            label: DEMO_BASELINE.ctaLinkLabel,
            target: '_blank',
          }),
        },
      })
    }

    if (copyField) {
      updates.push({
        id: copyField.id,
        patch: {
          richtext: JSON.stringify({
            source: 'Welcome to our **demo**.',
            html: '<p>Welcome to our <strong>demo</strong>.</p>',
          }),
        },
      })
    }
  }

  const teamSection = findSection(fieldList, 'team')
  if (teamSection) {
    const headingField = resolveField(fieldList, 'heading', teamSection.id)
    if (headingField) {
      updates.push({
        id: headingField.id,
        patch: { plain_text: DEMO_BASELINE.teamHeading },
      })
    }

    const membersArray = resolveField(fieldList, 'members', teamSection.id)
    if (membersArray) {
      const extraItems = fieldList.filter(
        (field) =>
          field.parent_id === membersArray.id &&
          field.kind === 'section' &&
          field.name !== 'item_0',
      )
      for (const item of extraItems) {
        const { error: deleteError } = await supabase
          .from('fields')
          .delete()
          .eq('id', item.id)
        if (deleteError) throw deleteError
      }

      const itemZero = fieldList.find(
        (field) =>
          field.parent_id === membersArray.id && field.name === 'item_0',
      )
      if (itemZero) {
        const nameField = resolveField(fieldList, 'name', itemZero.id)
        const photoField = resolveField(fieldList, 'photo', itemZero.id)
        if (nameField) {
          updates.push({
            id: nameField.id,
            patch: { plain_text: DEMO_BASELINE.teamMemberName },
          })
        }
        if (photoField) {
          updates.push({
            id: photoField.id,
            patch: {
              image: JSON.stringify({
                url: 'https://placehold.co/96x96',
                alt: DEMO_BASELINE.teamMemberName,
              }),
            },
          })
        }
      }
    }
  }

  for (const { id, patch } of updates) {
    const { error } = await supabase.from('fields').update(patch).eq('id', id)
    if (error) throw error
  }

  await supabase.auth.signOut()
}

/**
 * Resets site global fields (nav_label) to baseline values.
 */
export async function resetGlobalSiteFields(): Promise<void> {
  const supabase = await signInAsEditor()
  const siteId = await resolveE2eSiteId(supabase)

  const { data: globalRow, error: globalError } = await supabase
    .from('globals')
    .select('id')
    .eq('site_id', siteId)
    .eq('key', 'site')
    .maybeSingle()

  if (globalError) throw globalError
  if (!globalRow) throw new Error('Site global (key site) not found in Supabase')

  const { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('global_id', globalRow.id)

  if (fieldsError) throw fieldsError

  const navLabel = resolveField((fields ?? []) as FieldRow[], 'nav_label')
  if (!navLabel) {
    throw new Error('Global nav_label field not found in Supabase')
  }

  const { error: updateError } = await supabase
    .from('fields')
    .update({ plain_text: DEMO_BASELINE.navLabel })
    .eq('id', navLabel.id)

  if (updateError) throw updateError

  await supabase.auth.signOut()
}

/**
 * Resets all E2E baseline pages (home + demo) before/after a test run.
 */
export async function resetE2eBaselines(): Promise<void> {
  await resetHomePageFields()
  await resetDemoPageFields()
  await resetGlobalSiteFields()
}
