import { resetHomePageFields } from './helpers/db-reset'

/**
 * Restores home page fields to baseline after the full E2E run.
 */
export default async function globalTeardown(): Promise<void> {
  await resetHomePageFields()
}
