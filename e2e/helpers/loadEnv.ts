import { config as loadDotenv } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..',
)

/**
 * Loads `.env` from the project root (not `process.cwd()` — Playwright setup may differ).
 */
export function loadProjectEnv(): void {
  const envPath = resolve(projectRoot, '.env')
  if (!existsSync(envPath)) return
  loadDotenv({ path: envPath, override: false })
}

loadProjectEnv()

export { projectRoot }
