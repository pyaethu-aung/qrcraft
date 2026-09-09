import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  QRDesignConfig,
  QRErrorCorrectionLevel,
  QREyeFrameShape,
  QREyeCenterShape,
  QRPixelPattern,
  QRGradient,
  QRFrameConfig,
  QRFrameStyle,
  QRFramePosition,
} from '../types/qr'
import { getMatrixSize } from '../utils/qrShapeRenderer'
import {
  DESIGN_STORAGE_KEY,
  FRAME_STORAGE_KEY,
  FRAME_TEXT_LIMIT,
  loadDesignConfig,
  loadFrameConfig,
} from '../utils/persistedDesign'
import { writeJSON } from '../utils/safeLocalStorage'

const EC_LOGO_MAX: Record<QRErrorCorrectionLevel, number> = { L: 7, M: 15, Q: 25, H: 30 }

const RISKY_PATTERNS = new Set<QRPixelPattern>(['Dots', 'Vertical', 'Horizontal'])

export function useQRDesign(value: string = '', ecLevel: 'L' | 'M' | 'Q' | 'H' = 'M') {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [logoSizeState, setLogoSizeState] = useState(20)

  const maxLogoSize = EC_LOGO_MAX[ecLevel]
  const logoSize = Math.min(logoSizeState, maxLogoSize)

  const setLogoSize = useCallback((size: number) => {
    setLogoSizeState(Math.min(size, EC_LOGO_MAX[ecLevel]))
  }, [ecLevel])

  const [designConfig, setDesignConfig] = useState<QRDesignConfig>(loadDesignConfig)

  useEffect(() => {
    writeJSON(DESIGN_STORAGE_KEY, designConfig)
  }, [designConfig])

  const updateDesignConfig = useCallback((patch: Partial<QRDesignConfig>) => {
    setDesignConfig(prev => ({ ...prev, ...patch }))
  }, [])

  const setEyeFrameShape = useCallback((eyeFrameShape: QREyeFrameShape) => {
    updateDesignConfig({ eyeFrameShape })
  }, [updateDesignConfig])

  const setEyeCenterShape = useCallback((eyeCenterShape: QREyeCenterShape) => {
    updateDesignConfig({ eyeCenterShape })
  }, [updateDesignConfig])

  const setEyeFrameColor = useCallback((eyeFrameColor: string | null) => {
    updateDesignConfig({ eyeFrameColor })
  }, [updateDesignConfig])

  const setEyeCenterColor = useCallback((eyeCenterColor: string | null) => {
    updateDesignConfig({ eyeCenterColor })
  }, [updateDesignConfig])

  const setPixelPattern = useCallback((pixelPattern: QRPixelPattern) => {
    updateDesignConfig({ pixelPattern })
  }, [updateDesignConfig])

  const setFgGradient = useCallback((fgGradient: QRGradient | null) => {
    updateDesignConfig({ fgGradient })
  }, [updateDesignConfig])

  const [frameConfig, setFrameConfig] = useState<QRFrameConfig>(loadFrameConfig)

  useEffect(() => {
    writeJSON(FRAME_STORAGE_KEY, frameConfig)
  }, [frameConfig])

  const updateFrameConfig = useCallback((patch: Partial<QRFrameConfig>) => {
    setFrameConfig(prev => ({ ...prev, ...patch }))
  }, [])

  const setFrameStyle = useCallback((style: QRFrameStyle) => {
    updateFrameConfig({ style })
  }, [updateFrameConfig])

  const setFrameText = useCallback((text: string) => {
    updateFrameConfig({ text: text.slice(0, FRAME_TEXT_LIMIT) })
  }, [updateFrameConfig])

  const setFrameColor = useCallback((color: string) => {
    updateFrameConfig({ color })
  }, [updateFrameConfig])

  const setFramePosition = useCallback((position: QRFramePosition) => {
    updateFrameConfig({ position })
  }, [updateFrameConfig])

  const applyFrameConfig = useCallback((config: QRFrameConfig) => {
    setFrameConfig(config)
  }, [])

  const matrixSize = useMemo(() => getMatrixSize(value, ecLevel), [value, ecLevel])

  // Tracks which pattern the warning was dismissed for, so switching patterns
  // re-shows it without needing a separate "previous pattern" state variable.
  const [dismissedForPattern, setDismissedForPattern] = useState<QRPixelPattern | null>(null)
  const isWarningDismissed = dismissedForPattern === designConfig.pixelPattern
  const isRiskyPattern = !isWarningDismissed && RISKY_PATTERNS.has(designConfig.pixelPattern) && matrixSize >= 41

  const dismissWarning = () => setDismissedForPattern(designConfig.pixelPattern)

  return {
    designConfig,
    setDesignConfig,
    setEyeFrameShape,
    setEyeCenterShape,
    setEyeFrameColor,
    setEyeCenterColor,
    setPixelPattern,
    setFgGradient,
    isRiskyPattern,
    dismissWarning,
    logoDataUrl,
    setLogoDataUrl,
    logoSize,
    setLogoSize,
    maxLogoSize,
    frameConfig,
    setFrameStyle,
    setFrameText,
    setFrameColor,
    setFramePosition,
    applyFrameConfig,
    frameTextLimit: FRAME_TEXT_LIMIT,
  }
}
