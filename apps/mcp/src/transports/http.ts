import type { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { createServer } from '../server.js'

// Sessions with no activity for this long are treated as abandoned (dropped
// connection, client crash) and swept — StreamableHTTPServerTransport.onclose
// only fires on a clean close, so an idle sweep is the only thing bounding
// the session map's size for a long-running process.
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000
const SESSION_SWEEP_INTERVAL_MS = 5 * 60 * 1000

interface Session {
  transport: StreamableHTTPServerTransport
  lastActivity: number
}

export function startHttp(port: number): void {
  // createMcpExpressApp applies DNS-rebinding protection for the localhost
  // default host, and parses JSON bodies.
  const app = createMcpExpressApp()

  const sessions = new Map<string, Session>()

  function getSession(req: Request): Session | undefined {
    const sessionId = req.header('mcp-session-id')
    return sessionId ? sessions.get(sessionId) : undefined
  }

  const postHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const session = getSession(req)

      if (!session) {
        if (req.header('mcp-session-id') || !isInitializeRequest(req.body)) {
          res.status(400).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
            id: null,
          })
          return
        }

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: id => {
            sessions.set(id, { transport, lastActivity: Date.now() })
          },
        })
        transport.onclose = () => {
          if (transport.sessionId) sessions.delete(transport.sessionId)
        }

        // Each session gets its own McpServer: the SDK's Protocol.connect()
        // throws if a transport is already attached, so one server instance
        // cannot serve multiple concurrent transports.
        const server = createServer()
        await server.connect(transport)
        await transport.handleRequest(req, res, req.body)
        return
      }

      session.lastActivity = Date.now()
      await session.transport.handleRequest(req, res, req.body)
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
    const session = getSession(req)
    if (!session) {
      res.status(400).send('Invalid or missing session ID')
      return
    }
    session.lastActivity = Date.now()
    await session.transport.handleRequest(req, res)
  }

  app.post('/mcp', postHandler)
  app.get('/mcp', sessionHandler)
  app.delete('/mcp', sessionHandler)

  const sweep = setInterval(() => {
    const cutoff = Date.now() - SESSION_IDLE_TIMEOUT_MS
    for (const [id, session] of sessions) {
      if (session.lastActivity < cutoff) {
        sessions.delete(id)
        void session.transport.close()
      }
    }
  }, SESSION_SWEEP_INTERVAL_MS)
  sweep.unref()

  app.listen(port, () => {
    console.error(`qrcraft-mcp listening on http://localhost:${port}/mcp`)
  })
}
