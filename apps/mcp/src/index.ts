#!/usr/bin/env node
import { createServer } from './server.js'
import { startStdio } from './transports/stdio.js'
import { startHttp } from './transports/http.js'

async function main(): Promise<void> {
  const useHttp = process.argv.includes('--http') || process.env.MCP_TRANSPORT === 'http'

  if (useHttp) {
    const port = Number(process.env.PORT ?? 3000)
    startHttp(port)
    return
  }

  const server = createServer()
  await startStdio(server)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
