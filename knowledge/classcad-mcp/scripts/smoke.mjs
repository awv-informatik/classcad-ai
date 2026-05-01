#!/usr/bin/env node
// smoke.mjs — spawn the built server, exercise tools, exit non-zero on failure.

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const here = dirname(fileURLToPath(import.meta.url))
const serverPath = join(here, '..', 'dist', 'server.js')

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: { ...process.env, CLASSCAD_WS_URL: process.env.CLASSCAD_WS_URL ?? 'ws://0.0.0.0:9094/' },
  })
  const client = new Client({ name: 'classcad-mcp-smoke', version: '0.0.1' }, { capabilities: {} })
  await client.connect(transport)

  console.log('--- tools/list ---')
  const tools = await client.listTools()
  console.log(tools.tools.map(t => `  ${t.name}: ${t.description}`).join('\n'))

  console.log('\n--- session_info ---')
  const info = await client.callTool({ name: 'session_info', arguments: {} })
  console.log(info.content[0].text)

  console.log('\n--- clear (start with a fresh drawing) ---')
  const cleared = await client.callTool({ name: 'clear', arguments: {} })
  console.log(cleared.content[0].text)

  console.log('\n--- tree (refresh: empty) ---')
  const t0 = await client.callTool({ name: 'tree', arguments: { refresh: true } })
  const tree0 = JSON.parse(t0.content[0].text)
  console.log(`nodeCount=${tree0.nodeCount}, root=${tree0.root}`)

  console.log('\n--- find { type: "CC_Part" } before any creation ---')
  const f0 = await client.callTool({ name: 'find', arguments: { type: 'CC_Part' } })
  console.log(f0.content[0].text)

  console.log('\n--- inspect root node ---')
  const i0 = await client.callTool({ name: 'inspect', arguments: { id: tree0.root } })
  const ins = JSON.parse(i0.content[0].text)
  console.log(`found=${ins.found}, class=${ins.node?.class}, name=${ins.node?.name}`)

  console.log('\n--- list_methods { domain: "part", search: "box" } ---')
  const lm = await client.callTool({ name: 'list_methods', arguments: { domain: 'part', search: 'box' } })
  const lmd = JSON.parse(lm.content[0].text)
  console.log(`matched ${lmd.count} methods`)
  console.log(lmd.methods.slice(0, 5).map(m => `  ${m.method} — ${m.summary}`).join('\n'))

  console.log('\n--- describe_method v1.part.box (head only) ---')
  const dm = await client.callTool({ name: 'describe_method', arguments: { method: 'v1.part.box' } })
  console.log(dm.content[0].text.split('\n').slice(0, 12).join('\n'))

  console.log('\n--- call_api: v1.part.create ---')
  const ca1 = await client.callTool({ name: 'call_api', arguments: { method: 'v1.part.create', args: { name: 'PartViaMCP' } } })
  const cad1 = JSON.parse(ca1.content[0].text)
  console.log(`partId = ${cad1.result}, maxLevel = ${cad1.maxLevel}`)
  const partId = cad1.result

  console.log('\n--- call_api: v1.part.box on that part ---')
  const ca2 = await client.callTool({ name: 'call_api', arguments: {
    method: 'v1.part.box',
    args: { id: partId, name: 'BoxViaMCP', length: 80, width: 60, height: 40 },
  }})
  const cad2 = JSON.parse(ca2.content[0].text)
  console.log(`boxId = ${cad2.result}, maxLevel = ${cad2.maxLevel}`)

  console.log('\n--- find { type: "CC_Box" } after creation ---')
  const f1 = await client.callTool({ name: 'find', arguments: { type: 'CC_Box' } })
  const fd1 = JSON.parse(f1.content[0].text)
  console.log(`CC_Box count = ${fd1.count}`)
  console.log(fd1.nodes.map(n => `  id=${n.id} name="${n.name}"`).join('\n'))

  console.log('\n--- snapshot (the box we just made) ---')
  const snap = await client.callTool({ name: 'snapshot', arguments: { label: 'box-via-mcp' } })
  console.log(`Returned ${snap.content.length} content blocks`)
  for (const b of snap.content) {
    if (b.type === 'image') {
      const bytes = b.data ? Buffer.from(b.data, 'base64').length : 0
      console.log(`  image: ${b.mimeType}, ${bytes} bytes`)
    } else if (b.type === 'text') {
      console.log(`  text: ${b.text}`)
    }
  }

  console.log('\n--- save as STL ---')
  const stl = await client.callTool({ name: 'save', arguments: { format: 'STL' } })
  const stld = JSON.parse(stl.content[0].text)
  console.log(`format=${stld.format}, success=${stld.success}, bytes=${stld.bytes}`)

  console.log('\n--- clear (cleanup) ---')
  await client.callTool({ name: 'clear', arguments: {} })

  await client.close()
  process.exit(0)
}

main().catch(err => {
  console.error('SMOKE FAIL:', err?.message ?? err)
  process.exit(1)
})
