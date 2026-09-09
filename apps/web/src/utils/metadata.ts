import type { SeoMetadata } from '../types/i18n'

type MetaAttr = 'name' | 'property'

type MetaDescriptor = {
  attr: MetaAttr
  key: string
  value: string
}

function isBrowserEnvironment(): boolean {
  return typeof document !== 'undefined' && Boolean(document.head)
}

function upsertMetaTag(descriptor: MetaDescriptor) {
  if (!isBrowserEnvironment()) return

  const head = document.head
  const selector = `meta[${descriptor.attr}="${descriptor.key}"]`
  const existingMeta = head.querySelector(selector)
  let element: HTMLMetaElement

  if (existingMeta instanceof HTMLMetaElement) {
    element = existingMeta
  } else {
    element = document.createElement('meta')
    element.setAttribute(descriptor.attr, descriptor.key)
    head.appendChild(element)
  }

  element.content = descriptor.value
}

function updateCanonicalUrl(url: string) {
  if (!isBrowserEnvironment()) return

  const head = document.head
  const existingLink = head.querySelector('link[rel="canonical"]')
  let link: HTMLLinkElement

  if (existingLink instanceof HTMLLinkElement) {
    link = existingLink
  } else {
    link = document.createElement('link')
    link.rel = 'canonical'
    head.appendChild(link)
  }

  link.href = url
}

export function applySeoMetadata(seo: SeoMetadata) {
  if (!isBrowserEnvironment()) return
  document.title = seo.title
  updateCanonicalUrl(seo.canonical)

  const descriptors: MetaDescriptor[] = [
    { attr: 'name', key: 'description', value: seo.description },
    { attr: 'property', key: 'og:title', value: seo.ogTitle },
    { attr: 'property', key: 'og:description', value: seo.ogDescription },
    { attr: 'property', key: 'og:type', value: seo.ogType },
    { attr: 'name', key: 'twitter:card', value: seo.twitterCard },
    { attr: 'name', key: 'twitter:title', value: seo.twitterTitle },
    { attr: 'name', key: 'twitter:description', value: seo.twitterDescription },
  ]

  descriptors.forEach(upsertMetaTag)
}
