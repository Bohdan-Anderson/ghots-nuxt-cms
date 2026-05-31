import './helpers/loadEnv'
import { resetE2eBaselines } from './helpers/db-reset'

/**
 * Restores E2E baseline pages after the full run (home + demo).
 * Non-fatal — a failed run should not mask the original test failure.
 */
export default async function globalTeardown(): Promise<void> {
  try {
    await resetE2eBaselines()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[e2e teardown] Skipped baseline reset: ${message}`)
  }
}
