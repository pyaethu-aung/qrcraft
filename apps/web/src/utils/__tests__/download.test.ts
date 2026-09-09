import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest'
import { downloadBlob } from '../download.js'

describe('downloadBlob', () => {
  const createObjectURLMock = vi.fn()
  const revokeObjectURLMock = vi.fn()

  const originalCreateObjectURL = globalThis.URL.createObjectURL.bind(globalThis.URL)
  const originalRevokeObjectURL = globalThis.URL.revokeObjectURL.bind(globalThis.URL)

  beforeAll(() => {
    globalThis.URL.createObjectURL = createObjectURLMock
    globalThis.URL.revokeObjectURL = revokeObjectURLMock
  })

  afterAll(() => {
    globalThis.URL.createObjectURL = originalCreateObjectURL
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('should download a blob with correct filename', () => {
    const blob = new Blob(['test content'], { type: 'text/plain' })
    const fileName = 'test.txt'
    const mockUrl = 'blob:http://localhost/mock-url'

    createObjectURLMock.mockReturnValue(mockUrl)

    // Spy on createElement to capture the anchor element
    let createdAnchor: HTMLAnchorElement | undefined
    let clickSpy!: ReturnType<typeof vi.spyOn>
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName)
      if (tagName === 'a') {
        createdAnchor = element as HTMLAnchorElement
        clickSpy = vi.spyOn(createdAnchor, 'click').mockImplementation(function (this: void) {})
      }
      return element
    })

    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    downloadBlob(blob, fileName)

    expect(createObjectURLMock).toHaveBeenCalledWith(blob)
    expect(createElementSpy).toHaveBeenCalledWith('a')

    // Verify the created anchor properties
    expect(createdAnchor).toBeDefined()
    expect(createdAnchor!.href).toBe(mockUrl)
    expect(createdAnchor!.download).toBe(fileName)

    expect(appendChildSpy).toHaveBeenCalledWith(createdAnchor!)
    expect(clickSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalledWith(createdAnchor!)
    expect(revokeObjectURLMock).toHaveBeenCalledWith(mockUrl)
  })
})
