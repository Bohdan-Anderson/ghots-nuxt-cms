import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { getE2eEnv } from './helpers/env'
import { resetHomePageFields } from './helpers/db-reset'

/**
 * Validates env, resets DB baseline, and generates static dist for guest tests.
 */
export default async function globalSetup(): Promise<void> {
  getE2eEnv()
  await resetHomePageFields()

  execSync('npm run generate', {
    cwd: resolve(process.cwd()),
    stdio: 'inherit',
    env: process.env,
  })
}
