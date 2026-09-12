import { render, screen } from '@testing-library/react-native'

import { QrPreview } from '@/components/qr-preview'
import { DEFAULT_QR_BG_COLOR, DEFAULT_QR_DESIGN_CONFIG, DEFAULT_QR_FG_COLOR } from '@/constants/qrDefaults'

// Regression test: generateQRPaths -> qrcode.create throws on an empty
// string ("No input text"). An earlier version of this component called it
// unconditionally inside useMemo, crashing the Generate screen on mount
// (caught on a real device, not by typecheck/lint).
describe('QrPreview', () => {
  it('renders the placeholder instead of crashing when value is empty', async () => {
    await render(
      <QrPreview
        value=""
        ecLevel="M"
        fgColor={DEFAULT_QR_FG_COLOR}
        bgColor={DEFAULT_QR_BG_COLOR}
        design={DEFAULT_QR_DESIGN_CONFIG}
        size={220}
      />,
    )

    expect(screen.getByLabelText('QR code preview placeholder')).toBeTruthy()
  })

  it('renders the QR svg once a value is present', async () => {
    await render(
      <QrPreview
        value="https://example.com"
        ecLevel="M"
        fgColor={DEFAULT_QR_FG_COLOR}
        bgColor={DEFAULT_QR_BG_COLOR}
        design={DEFAULT_QR_DESIGN_CONFIG}
        size={220}
      />,
    )

    expect(screen.queryByLabelText('QR code preview placeholder')).toBeNull()
  })
})
