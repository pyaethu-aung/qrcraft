import type { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { createServer } from '../server.js'

export function startHttp(port: number): void {
  // createMcpExpressApp applies DNS-rebinding protection for the localhost
  // default host, and parses JSON bodies.
  const app = createMcpExpressApp()

  const transports = new Map<string, StreamableHTTPServerTransport>()

  const postHandler = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.header('mcp-session-id')

    try {
      let transport = sessionId ? transports.get(sessionId) : undefined

      if (!transport) {
        if (sessionId || !isInitializeRequest(req.body)) {
          res.status(400).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
            id: null,
          })
          return
        }

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: id => {
            transports.set(id, transport!)
          },
        })
        transport.onclose = () => {
          if (transport?.sessionId) transports.delete(transport.sessionId)
        }

        const server = createServer()
        await server.connect(transport)
        await transport.handleRequest(req, res, req.body)
        return
      }

      await transport.handleRequest(req, res, req.body)
    } catch (error) {
      console.error('Error handling MCP request:', error)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        })
      }
    }
  }

  const sessionHandler = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.header('mcp-session-id')
    const transport = sessionId ? transports.get(sessionId) : undefined
    if (!transport) {
      res.status(400).send('Invalid or missing session ID')
      return
    }
    await transport.handleRequest(req, res)
  }

  app.post('/mcp', postHandler)
  app.get('/mcp', sessionHandler)
  app.delete('/mcp', sessionHandler)

  app.listen(port, () => {
    console.error(`qrcraft-mcp listening on http://localhost:${port}/mcp`)
  })
}
