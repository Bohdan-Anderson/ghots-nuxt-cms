#!/usr/bin/env node
/**
 * CLI for ghots CMS edge functions.
 *
 * Usage:
 *   node cms-cli.mjs pages list [--site SITE]
 *   node cms-cli.mjs pages create --slug SLUG --template KEY [--title TITLE] [--site SITE]
 *   node cms-cli.mjs pages delete --page SLUG [--site SITE]
 *   node cms-cli.mjs templates list [--site SITE]
 *   node cms-cli.mjs templates create --key KEY --label LABEL [--site SITE]
 *   node cms-cli.mjs templates delete --key KEY [--site SITE]
 *   node cms-cli.mjs page get --page SLUG [--site SITE] [-o FILE]
 *   node cms-cli.mjs page put --page SLUG --file FILE [--site SITE]
 *   node cms-cli.mjs page post --page SLUG --file FILE [--site SITE]
 *   node cms-cli.mjs payload --file FILE [-o FILE]
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  createCmsClient,
  formatJson,
  loadConfig,
  parseEnvFile,
  buildWritePayload,
} from './cms-api.mjs'

const SKILL_ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname))

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const flags = {}
  const positional = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      positional.push(arg)
    }
  }

  return { positional, flags }
}

/**
 * @param {Record<string, string | boolean>} flags
 */
function resolveEnv(flags) {
  /** @type {Record<string, string | undefined>} */
  let env = { ...process.env }

  const envFile =
    typeof flags['env-file'] === 'string'
      ? flags['env-file']
      : typeof flags.env === 'string'
        ? flags.env
        : undefined

  if (envFile) {
    env = { ...env, ...parseEnvFile(path.resolve(envFile)) }
  }

  return env
}

/**
 * @param {Record<string, string | boolean>} flags
 * @param {Record<string, string | undefined>} env
 */
function resolveSite(flags, env) {
  const site = typeof flags.site === 'string' ? flags.site : env.CMS_SITE_KEY
  if (!site) throw new Error('Pass --site SITE or set CMS_SITE_KEY')
  return site
}

/**
 * @param {unknown} data
 * @param {Record<string, string | boolean>} flags
 */
function writeOutput(data, flags) {
  const text = formatJson(data)
  const out = typeof flags.o === 'string' ? flags.o : typeof flags.output === 'string' ? flags.output : null
  if (out) {
    fs.writeFileSync(path.resolve(out), text)
    console.error(`Wrote ${path.resolve(out)}`)
  } else {
    process.stdout.write(text)
  }
}

function printHelp() {
  console.log(`ghots CMS API CLI

Environment (or --env-file PATH):
  SUPABASE_URL / VITE_SUPABASE_URL
  ANON_KEY / SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY
  CMS_EDITOR_EMAIL / CMS_EDITOR_PASSWORD   (writes only)
  CMS_SITE_KEY                             (default --site)

Commands:
  pages list [--site SITE]
  pages create --slug SLUG --template KEY [--title TITLE] [--site SITE]
  pages delete --page SLUG [--site SITE]

  templates list [--site SITE]
  templates create --key KEY --label LABEL [--site SITE]
  templates delete --key KEY [--site SITE]

  page get --page SLUG [--site SITE] [-o FILE]
  page put --page SLUG --file FILE [--site SITE]     merge update
  page post --page SLUG --file FILE [--site SITE]    full field replace

  payload --file PAGE.json [-o payload.json]         add auth wrapper for PUT/POST

Options:
  --env-file PATH    load .env-style file
  --site SITE        site key (sites.key)
  -o, --output FILE  write JSON to file instead of stdout
`)
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))

  if (!positional.length || flags.help) {
    printHelp()
    process.exit(flags.help ? 0 : 1)
  }

  const [resource, action] = positional
  const env = resolveEnv(flags)
  const client = createCmsClient(loadConfig(env))

  try {
    if (resource === 'pages' && action === 'list') {
      writeOutput(await client.listPages(resolveSite(flags, env)), flags)
      return
    }

    if (resource === 'pages' && action === 'create') {
      const slug = typeof flags.slug === 'string' ? flags.slug : null
      const template = typeof flags.template === 'string' ? flags.template : null
      if (!slug || !template) throw new Error('pages create requires --slug and --template')
      writeOutput(
        await client.createPage(resolveSite(flags, env), {
          slug,
          templateKey: template,
          title: typeof flags.title === 'string' ? flags.title : null,
        }),
        flags,
      )
      return
    }

    if (resource === 'pages' && action === 'delete') {
      const page = typeof flags.page === 'string' ? flags.page : null
      if (!page) throw new Error('pages delete requires --page')
      writeOutput(await client.deletePage(resolveSite(flags, env), page), flags)
      return
    }

    if (resource === 'templates' && action === 'list') {
      writeOutput(await client.listTemplates(resolveSite(flags, env)), flags)
      return
    }

    if (resource === 'templates' && action === 'create') {
      const key = typeof flags.key === 'string' ? flags.key : null
      const label = typeof flags.label === 'string' ? flags.label : null
      if (!key || !label) throw new Error('templates create requires --key and --label')
      writeOutput(
        await client.createTemplate(resolveSite(flags, env), { key, label }),
        flags,
      )
      return
    }

    if (resource === 'templates' && action === 'delete') {
      const key = typeof flags.key === 'string' ? flags.key : null
      if (!key) throw new Error('templates delete requires --key')
      writeOutput(await client.deleteTemplate(resolveSite(flags, env), key), flags)
      return
    }

    if (resource === 'page' && action === 'get') {
      const page = typeof flags.page === 'string' ? flags.page : null
      if (!page) throw new Error('page get requires --page')
      writeOutput(await client.getPage(resolveSite(flags, env), page), flags)
      return
    }

    if (resource === 'page' && (action === 'put' || action === 'post')) {
      const page = typeof flags.page === 'string' ? flags.page : null
      const file = typeof flags.file === 'string' ? flags.file : null
      if (!page || !file) throw new Error(`page ${action} requires --page and --file`)
      const content = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))
      writeOutput(
        await client.writePage(
          resolveSite(flags, env),
          page,
          content,
          action === 'post' ? 'replace' : 'merge',
        ),
        flags,
      )
      return
    }

    if (resource === 'payload') {
      const file = typeof flags.file === 'string' ? flags.file : null
      if (!file) throw new Error('payload requires --file')
      const content = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))
      const { email, password } = loadConfig(env)
      if (!email || !password) throw new Error('payload requires CMS_EDITOR_EMAIL and CMS_EDITOR_PASSWORD')
      writeOutput(buildWritePayload(content, { email, password }), flags)
      return
    }

    throw new Error(`Unknown command: ${resource} ${action ?? ''}`.trim())
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}

main()
