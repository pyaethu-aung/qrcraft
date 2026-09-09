import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocaleContext } from './LocaleProvider'
import type { ShareMethod, SharePayload, ShareRequest } from '../types/qr'
import {
  canShareFiles,
  copyPayloadToClipboard,
  createSharePayload,
  downloadPayload,
  isMobileDevice,
  payloadToFile,
  supportsClipboardImage,
  supportsNavigatorShare,
} from '../utils/share'

const SHARE_METHOD: ShareMethod = 'navigator-share'
const CLIPBOARD_METHOD: ShareMethod = 'clipboard'
const DOWNLOAD_METHOD: ShareMethod = 'download'

const normalizeErrorMessage = (value: unknown): string | undefined => {
  if (value instanceof Error) {
    return value.message
  }

  if (typeof value === 'string') {
    return value
  }

  return undefined
}

const buildRequest = (
  method: ShareMethod,
  status: ShareRequest['status'],
  targetSupported: boolean,
  errorMessage?: string,
): ShareRequest => ({
  method,
  targetSupported,
  status,
  errorMessage,
})

export const useQRShare = () => {
  const { translate } = useLocaleContext()
  const [shareRequest, setShareRequest] = useState<ShareRequest | null>(null)
  const shareInFlight = useRef(false)
  const permissionBlocked = useRef(false)

  // Instrumentation for SC-005: Monitor "cannot share QR" rate
  // In a real app, this would send data to an analytics/logging service (e.g. Sentry, Datadog)
  useEffect(() => {
    if (
      shareRequest?.status === 'shared' ||
      shareRequest?.status === 'failed' ||
      shareRequest?.status === 'canceled'
    ) {
      // Placeholder for actual observability service call
      console.log('[Observation] Share outcome:', {
        method: shareRequest.method,
        status: shareRequest.status,
        error: shareRequest.errorMessage,
        isTechnicalFailure: shareRequest.status === 'failed',
      })
    }
  }, [shareRequest])

  const isSharing = shareRequest?.status === 'pending'

  const share = useCallback(
    async (canvasElement: HTMLCanvasElement | null) => {
      if (shareInFlight.current) {
        return
      }

      const attemptClipboardFallback = async (payload: SharePayload): Promise<boolean> => {
        if (!supportsClipboardImage()) {
          return false
        }

        setShareRequest(buildRequest(CLIPBOARD_METHOD, 'pending', true))
        await copyPayloadToClipboard(payload)
        setShareRequest(buildRequest(CLIPBOARD_METHOD, 'shared', true))

        return true
      }

      const triggerDownloadFallback = (payload: SharePayload) => {
        setShareRequest(buildRequest(DOWNLOAD_METHOD, 'shared', true))
        downloadPayload(payload)
      }

      const handleFallback = async (payload: SharePayload) => {
        const clipboardAvailable = await attemptClipboardFallback(payload)
        if (!clipboardAvailable) {
          triggerDownloadFallback(payload)
        }
      }

      shareInFlight.current = true

      let lastPayload: SharePayload | null = null

      try {
        lastPayload = await createSharePayload(canvasElement)
        const file = payloadToFile(lastPayload)
        const navigatorAvailable = supportsNavigatorShare() && !permissionBlocked.current
        const targetSupported = navigatorAvailable && (canShareFiles([file]) || isMobileDevice())

        if (!targetSupported) {
          setShareRequest(
            buildRequest(
              SHARE_METHOD,
              'failed',
              false,
              permissionBlocked.current
                ? translate('preview.shareStatusPermissionDenied')
                : translate('preview.shareStatusFailed'),
            ),
          )
          await handleFallback(lastPayload)
          return
        }

        setShareRequest(buildRequest(SHARE_METHOD, 'pending', true))

        const shareFn =
          typeof navigator.share === 'function' ? navigator.share.bind(navigator) : undefined
        if (typeof shareFn !== 'function') {
          setShareRequest(
            buildRequest(SHARE_METHOD, 'failed', false, 'Navigator share function is unavailable'),
          )
          await handleFallback(lastPayload)
          return
        }

        await shareFn({ files: [file] })

        setShareRequest(buildRequest(SHARE_METHOD, 'shared', true))
      } catch (error) {
        const maybeError = error as Error
        const isPermissionDenied = maybeError?.name === 'NotAllowedError'
        const isCanceled = maybeError?.name === 'AbortError' || isPermissionDenied

        if (isPermissionDenied) {
          permissionBlocked.current = true
          if (lastPayload) {
            setShareRequest(
              buildRequest(
                SHARE_METHOD,
                'failed',
                true,
                translate('preview.shareStatusPermissionDenied'),
              ),
            )
            await handleFallback(lastPayload)
            return
          }
        }

        setShareRequest(
          buildRequest(
            SHARE_METHOD,
            isCanceled ? 'canceled' : 'failed',
            true,
            normalizeErrorMessage(error),
          ),
        )
      } finally {
        shareInFlight.current = false
      }
    },
    [translate],
  )

  return { share, shareRequest, isSharing }
}
