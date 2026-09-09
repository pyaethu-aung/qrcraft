/**
 * Minimal ambient types for `utif` (Photopea's pure-JS TIFF decoder), which ships no types of
 * its own. Only the three functions the Scan decode path uses are declared.
 */
declare module 'utif' {
  interface UtifImageFileDirectory {
    width: number
    height: number
    [key: string]: unknown
  }

  const UTIF: {
    /** Parses the TIFF container into its image file directories. */
    decode(buffer: ArrayBuffer | Uint8Array): UtifImageFileDirectory[]
    /** Decodes the pixel data of `ifd` (in place) from the original buffer. */
    decodeImage(buffer: ArrayBuffer | Uint8Array, ifd: UtifImageFileDirectory): void
    /** Returns the decoded image as a flat RGBA byte array. */
    toRGBA8(ifd: UtifImageFileDirectory): Uint8Array
  }

  export default UTIF
}
