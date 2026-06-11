import { describe, expect, it } from 'vitest'
import { collectFieldManifest } from './collectFieldManifest'

describe('collectFieldManifest', () => {
  it('collects page-level and nested section fields', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <h1 data-name="title" data-type="plain_text"></h1>
      <section data-name="main" data-type="section">
        <p data-name="body" data-type="plain_text"></p>
      </section>
    `

    const manifest = collectFieldManifest(root)

    expect(manifest).toHaveLength(3)
    expect(manifest.find((entry) => entry.name === 'title')).toMatchObject({
      parentName: null,
      declaredType: 'plain_text',
    })
    expect(manifest.find((entry) => entry.name === 'main')).toMatchObject({
      declaredType: 'section',
    })
    expect(manifest.find((entry) => entry.name === 'body')).toMatchObject({
      parentName: 'main',
      declaredType: 'plain_text',
    })
  })

  it('scopes fields to slice wrappers', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <section data-slice-id="slice-1" data-slice-type="hero">
        <h2 data-name="headline" data-type="plain_text"></h2>
      </section>
    `

    const manifest = collectFieldManifest(root)
    expect(manifest).toHaveLength(1)
    expect(manifest[0]).toMatchObject({
      name: 'headline',
      sliceId: 'slice-1',
      sliceTypeKey: 'hero',
      parentName: null,
    })
  })

  it('dedupes duplicate data-name entries in the same scope', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <p data-name="title" data-type="plain_text"></p>
      <span data-name="title" data-type="plain_text"></span>
    `

    expect(collectFieldManifest(root)).toHaveLength(1)
  })
})
