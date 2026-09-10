# @qrcraft/mcp

An MCP (Model Context Protocol) server that generates and reads QR codes. It
exposes three tools, over either transport, consuming `@qrcraft/core`'s
payload builders, capacity guard, and pixel decoder directly — never a copy
of that logic (see
[`docs/specs/monorepo-consolidation.md`](../../docs/specs/monorepo-consolidation.md)
for why).

## Tools

### `generate_qr`

Plain text or a URL.

| Field | Type | Default | Notes |
|---|---|---|---|
| `content` | string | — | required, min length 1 |
| `ecLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | error-correction level |
| `format` | `'png' \| 'svg'` | `'png'` | |
| `size` | number | `512` | pixels, PNG only, 64–2048 |
| `margin` | number | `4` | quiet-zone width in modules, 0–20 |
| `dark` / `light` | string (hex) | `#000000` / `#ffffff` | |

### `generate_structured_qr`

One structured content type via a `payload` discriminated union (plus the
same appearance fields as `generate_qr`, minus `content`):

| `payload.type` | Required fields | Optional fields |
|---|---|---|
| `wifi` | `ssid` | `password`, `security` (`WPA`/`WEP`/`nopass`), `hidden` |
| `vcard` | — | `firstName`, `lastName`, `phone`, `email`, `company`, `jobTitle`, `website` |
| `email` | `to` | `subject`, `body` |
| `sms` | `number` | `message` |
| `tel` | `number` | — |
| `geo` | `latitude`, `longitude` | — |
| `vevent` | `summary`, `start` | `end`, `allDay`, `location`, `description` |
| `crypto` | `network` (`bitcoin`/`ethereum`), `address` | `amount`, `label` |

A payload missing a required field returns an `isError: true` text result
("`<type>`: missing a required field for this content type") rather than a
malformed QR code.

### Result shape (`generate_qr` / `generate_structured_qr`)

Both return one MCP content block: `{ type: 'image', data: <base64>,
mimeType: 'image/png' }` for `format: 'png'`, or `{ type: 'text', text:
<svg string> }` for `format: 'svg'`. Content over the error-correction
level's byte capacity returns `isError: true` with a message naming the
used/max byte counts, instead of throwing.

### `decode_qr`

Reads a QR code back out of an image.

| Field | Type | Default | Notes |
|---|---|---|---|
| `image` | string (base64) | — | required, PNG/JPEG/BMP/GIF/TIFF |

Returns one text content block, a JSON object: `{ value: string,
contentType: 'url' \| 'wifi' \| 'vcard' \| 'email' \| 'sms' \| 'tel' \| 'geo'
\| 'vevent' \| 'crypto' \| 'text', openableUrl: string | null }`.
`openableUrl` is non-null only when `contentType` is `'url'` (an `http(s)`
link, never `javascript:`/`file:`/etc.).

Two distinct error paths, both `isError: true`: bytes that aren't a
readable image at all ("Could not read the image: ..."), versus a valid
image that just has no QR code in it ("No QR code found in the image.").

## Build & run

```bash
npm run build --workspace=packages/core   # @qrcraft/core must be built first
npm run build --workspace=apps/mcp

node apps/mcp/dist/index.js               # stdio (default)
node apps/mcp/dist/index.js --http        # Streamable HTTP, port 3000
PORT=4000 node apps/mcp/dist/index.js --http   # HTTP on a specific port
MCP_TRANSPORT=http node apps/mcp/dist/index.js # same as --http

npm run dev --workspace=apps/mcp          # tsx, no build step, stdio
```

## Testing

**MCP Inspector** (recommended — interactive, no client setup):

```bash
npx @modelcontextprotocol/inspector node apps/mcp/dist/index.js
```

Opens a local web UI to call any of the three tools directly and inspect the
returned image/SVG/JSON or error. Good for poking at edge cases (an
over-capacity string, a Wi-Fi payload with no `ssid`, a non-image byte
string for `decode_qr`) without writing a client.

**Register with Claude Code:**

```bash
claude mcp add qrcraft -- node /absolute/path/to/apps/mcp/dist/index.js
```

Then ask Claude to "generate a QR code for https://example.com" or "make a
Wi-Fi QR code for network X with password Y" in a session — it calls the
tool and should return an actual image.

**HTTP transport by hand**, if you need to test that path specifically: POST
an `initialize` request to `http://localhost:3000/mcp` first (the response
carries an `mcp-session-id` header), then include that header on every
subsequent `tools/call` POST to the same endpoint. `GET`/`DELETE` on the same
path resume a stream or terminate the session.

There is no committed automated test suite for this app yet (no existing
precedent for a Node-side app in this repo to follow) — the Inspector or the
Claude Code registration above are the way to verify a change by hand.

## Architecture notes

- **Own renderer, not the web app's.** `render.ts` uses the `qrcode`
  package's native Node output (`QRCode.toBuffer` / `QRCode.toString`), not
  `apps/web`'s DOM-bound `renderQrPngBlob` — no styled shapes, gradients,
  frames, or logos here, just the plain QR.
- **Own image decoder too.** `decode.ts` uses Jimp (pure JS, no native
  binary) to turn an uploaded image into raw pixel data, then the same
  `decodeImageData` (`@qrcraft/core/utils/qrDecode`) the web app's Scan view
  uses — not the web app's `BarcodeDetector`/canvas glue, which is
  browser-only.
- **HTTP sessions.** Each session gets its own `McpServer` instance (the
  SDK's `Protocol.connect()` throws if a transport is already attached to
  one, so a server can't be shared across sessions). Idle sessions (30 min
  with no request) are swept every 5 minutes, since
  `StreamableHTTPServerTransport.onclose` only fires on a clean close, not
  a dropped connection.
- **DNS-rebinding protection** comes from the SDK's `createMcpExpressApp()`
  helper (localhost-only by default), not a bare `express()` app.
