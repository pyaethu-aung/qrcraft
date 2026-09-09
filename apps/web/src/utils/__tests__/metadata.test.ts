import { beforeEach, describe, expect, it } from 'vitest'

import en from '../../data/i18n/en.json'
import { applySeoMetadata } from '../metadata'

describe('applySeoMetadata', () => {
  beforeEach(() => {
    document.title = 'tmp'
    document.head.innerHTML = ''
  })

  it('sets the document title, canonical link, and meta tags', () => {
    applySeoMetadata(en.seo)

    expect(document.title).toBe(en.seo.title)

    const canonicalLink = document.head.querySelector('link[rel="canonical"]')
    expect(canonicalLink).toBeInstanceOf(HTMLLinkElement)
    expect(canonicalLink).toHaveAttribute('href', en.seo.canonical)

    const description = document.head.querySelector('meta[name="description"]')
    expect(description).toBeInstanceOf(HTMLMetaElement)
    expect(description).toHaveProperty('content', en.seo.description)

    const ogTitle = document.head.querySelector('meta[property="og:title"]')
    expect(ogTitle).toBeInstanceOf(HTMLMetaElement)
    expect(ogTitle).toHaveProperty('content', en.seo.ogTitle)

    const twitterCard = document.head.querySelector('meta[name="twitter:card"]')
    expect(twitterCard).toBeInstanceOf(HTMLMetaElement)
    expect(twitterCard).toHaveProperty('content', en.seo.twitterCard)
  })

  it('updates existing meta tags instead of duplicating them', () => {
    applySeoMetadata(en.seo)

    const updatedSeo = {
      ...en.seo,
      title: 'Updated title',
      description: 'Updated description',
    }

    applySeoMetadata(updatedSeo)

    expect(document.title).toBe(updatedSeo.title)
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1)
    const descriptionMeta = document.head.querySelector('meta[name="description"]')
    expect(descriptionMeta).toBeInstanceOf(HTMLMetaElement)
    expect(descriptionMeta?.getAttribute('content')).toBe(updatedSeo.description)
  })
})
