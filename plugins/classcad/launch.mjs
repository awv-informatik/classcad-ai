#!/usr/bin/env node
// Starts the ClassCAD MCP server, the npm package @classcad/mcp at the pinned
// version, on every operating system. A plugin's .mcp.json cannot vary by
// platform, and native Windows cannot start `npx` (a .cmd file) directly; it
// can start `node`. stdin/stdout are passed straight through: this process
// only waits for the server to end.
import { spawn } from 'node:child_process'

const PACKAGE = '@classcad/mcp@0.1.4'

const windows = process.platform === 'win32'
const server = spawn(windows ? 'npx.cmd' : 'npx', ['-y', PACKAGE, ...process.argv.slice(2)], {
  stdio: 'inherit',
  // .cmd files only run through the shell on Windows; the arguments are fixed above.
  shell: windows,
})
server.on('error', err => {
  console.error(`[classcad] could not start npx (${err.message}). Node.js 20 or newer with npx is required.`)
  process.exit(1)
})
server.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal))
