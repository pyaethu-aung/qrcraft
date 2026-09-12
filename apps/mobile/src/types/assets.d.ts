// Neither expo nor react-native ships ambient module types for static image
// assets, so a plain `import x from './foo.png'` resolves to an implicit
// `any`/error type under strict TS. Declaring it once here lets every screen
// use `import`, matching Metro's own bundling behavior, instead of
// `require()` sprinkled everywhere.
declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native'
  const value: ImageSourcePropType
  export default value
}

declare module '*.jpg' {
  import type { ImageSourcePropType } from 'react-native'
  const value: ImageSourcePropType
  export default value
}
