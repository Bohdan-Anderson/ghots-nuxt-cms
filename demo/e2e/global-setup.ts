import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import './helpers/loadEnv'
import { getE2eEnv } from './helpers/env'
import { resetE2eBaselines } from './helpers/db-reset'
import { projectRoot } from './helpers/loadEnv'

/**
 * Validates env, resets DB baseline, and generates static dist for guest tests.
 */
export default async function globalSetup(): Promise<void> {
  getE2eEnv()
  await resetE2eBaselines()

  execSync('npm run generate', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  })
}
