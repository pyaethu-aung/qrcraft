import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { generateQrInputSchema, handleGenerateQr } from './tools/generateQr.js'
import { generateStructuredQrInputSchema, handleGenerateStructuredQr } from './tools/generateStructuredQr.js'

export function createServer(): McpServer {
  const server = new McpServer({ name: 'qrcraft-mcp', version: '0.1.0' })

  server.registerTool(
    'generate_qr',
    {
      title: 'Generate QR code',
      description: 'Generate a QR code (PNG or SVG) for plain text or a URL.',
      inputSchema: generateQrInputSchema,
    },
    handleGenerateQr,
  )

  server.registerTool(
    'generate_structured_qr',
    {
      title: 'Generate structured QR code',
      description:
        'Generate a QR code for a structured content type: Wi-Fi, vCard contact, email, SMS, phone call, geo location, calendar event, or crypto payment URI.',
      inputSchema: generateStructuredQrInputSchema,
    },
    handleGenerateStructuredQr,
  )

  return server
}
