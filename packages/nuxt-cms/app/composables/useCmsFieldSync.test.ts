import { describe, expect, it, vi } from 'vitest'
import { useCmsFieldSync } from './useCmsFieldSync'

describe('useCmsFieldSync', () => {
  it('invokes the registered DOM sync callback', async () => {
    const sync = useCmsFieldSync()
    const fn = vi.fn(async () => undefined)

    sync.registerFieldSync(fn)
    await sync.requestFieldSync()

    expect(fn).toHaveBeenCalledOnce()
  })

  it('no-ops when no callback is registered', async () => {
    const sync = useCmsFieldSync()
    sync.registerFieldSync(null)
    await expect(sync.requestFieldSync()).resolves.toBeUndefined()
  })

  it('replaces the callback when re-registered', async () => {
    const sync = useCmsFieldSync()
    const first = vi.fn(async () => undefined)
    const second = vi.fn(async () => undefined)

    sync.registerFieldSync(first)
    sync.registerFieldSync(second)
    await sync.requestFieldSync()

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })
})
