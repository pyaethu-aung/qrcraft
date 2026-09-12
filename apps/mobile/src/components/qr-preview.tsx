import { generateQRPaths } from '@qrcraft/core'
import type { QRDesignConfig, QRErrorCorrectionLevel } from '@qrcraft/core'
import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import Svg, { Path, Rect } from 'react-native-svg'

import { ThemedText } from '@/components/themed-text'
import { useTheme } from '@/hooks/use-theme'

// Renders the same path data apps/web composes in qrSvgComposer.ts, via
// react-native-svg instead of a raw SVG string — no frame or gradient
// support yet (Design advanced, build sequence step 6).
export interface QrPreviewProps {
  value: string
  ecLevel: QRErrorCorrectionLevel
  fgColor: string
  bgColor: string
  design: QRDesignConfig
  size: number
  isPending?: boolean
}

const CELL_SIZE = 10

export function QrPreview({ value, ecLevel, fgColor, bgColor, design, size, isPending }: QrPreviewProps) {
  const theme = useTheme()

  // generateQRPaths -> qrcode.create throws on an empty string ("No input
  // text"), so it must never run with one — guarded inside the memo (hooks
  // can't be called conditionally) rather than by skipping the memo itself.
  const parsed = useMemo(
    () =>
      value
        ? generateQRPaths(
            value,
            ecLevel,
            design.eyeFrameShape,
            design.eyeCenterShape,
            design.pixelPattern,
            CELL_SIZE,
          )
        : null,
    [value, ecLevel, design.eyeFrameShape, design.eyeCenterShape, design.pixelPattern],
  )

  if (!parsed) {
    return (
      // key differs from the QR branch below so React treats this as a
      // fresh mount on swap, triggering the entering/exiting crossfade
      // instead of an instant, jarring pop (emil-design-eng review).
      <Animated.View
        key="placeholder"
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
        style={[
          styles.placeholder,
          { width: size, height: size, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceInset },
        ]}
        accessibilityRole="image"
        accessibilityLabel="QR code preview placeholder">
        {isPending ? (
          <ActivityIndicator color={theme.textSecondary} />
        ) : (
          <ThemedText type="body" themeColor="textSecondary" style={styles.placeholderText}>
            Enter a value to generate a QR code
          </ThemedText>
        )}
      </Animated.View>
    )
  }

  const { dataPath, eyeFramePath, eyeCenterPath, eyeBgPath, size: modules } = parsed
  const viewBoxSize = modules * CELL_SIZE
  const eyeFrameFill = design.eyeFrameColor ?? fgColor
  const eyeCenterFill = design.eyeCenterColor ?? fgColor

  // Keyed on everything that actually re-renders the module grid: content
  // (`value` — already the 300ms-debounced liveValue from useQrContent, so
  // this fires in bursts as a sentence is typed, not on every keystroke),
  // reliability's EC level, and eye/pixel shape. Remounting on that key —
  // and with it the entering/exiting crossfade below — is what turns "a
  // totally different QR pattern replaces the old one instantly" into a
  // transition. The two fill colors are excluded on purpose: recoloring
  // the same grid in place needs no transition, only a value/shape change
  // that redraws the modules does.
  const shapeKey = `qr-${value}-${ecLevel}-${design.eyeFrameShape}-${design.eyeCenterShape}-${design.pixelPattern}`

  return (
    <Animated.View
      key={shapeKey}
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <Rect x={0} y={0} width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
        <Path d={dataPath} fill={fgColor} />
        <Path d={eyeBgPath} fill={bgColor} />
        <Path d={eyeFramePath} fill={eyeFrameFill} fillRule="evenodd" />
        <Path d={eyeCenterPath} fill={eyeCenterFill} />
      </Svg>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  placeholderText: {
    textAlign: 'center',
    paddingHorizontal: 24,
  },
})
