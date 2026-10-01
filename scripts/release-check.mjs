#!/usr/bin/env node
// release-check.mjs — before a release: do the versions agree, and what is new?
//
//   node scripts/release-check.mjs [mcp-vX.Y.Z]
//
// Checks that the MCP's version is the same in packages/mcp/package.json, the
// VERSION constant (src/mcp-server.ts), server.json (top level and its npm
// package) and the Claude plugin (plugins/classcad: plugin.json and the package
// pinned in launch.mjs), and matches the tag when one is given. Then prints, one per line,
// the package directories whose current version is not on npm yet — in
// dependency order, the order they must be published in. Exit 1 on a mismatch.
import { readFileSync } from 'node:fs'

const PACKAGES = ['skill', 'script', 'renderer', 'mcp']
const json = p => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'))
const fail = msg => {
  console.error(`release-check: ${msg}`)
  process.exit(1)
}

const pkg = json('packages/mcp/package.json')
const server = json('packages/mcp/server.json')
const constant = /export const VERSION = '([^']+)'/.exec(readFileSync(new URL('../packages/mcp/src/mcp-server.ts', import.meta.url), 'utf8'))?.[1]
const versions = {
  'package.json': pkg.version,
  'mcp-server.ts VERSION': constant,
  'server.json version': server.version,
  'server.json package version': server.packages?.[0]?.version,
}
const tag = process.argv[2]
if (tag) versions[`tag ${tag}`] = tag.replace(/^mcp-v/, '')
if (new Set(Object.values(versions)).size !== 1) fail(`versions disagree: ${JSON.stringify(versions)}`)
if (pkg.mcpName !== server.name) fail(`mcpName ${pkg.mcpName} is not server.json name ${server.name}`)
if (server.packages?.[0]?.identifier !== pkg.name) fail(`server.json points at ${server.packages?.[0]?.identifier}, not ${pkg.name}`)

// The Claude plugin pins the MCP to an exact version (the directory requires it): same version, same package.
const plugin = json('plugins/classcad/.claude-plugin/plugin.json')
const launcher = readFileSync(new URL('../plugins/classcad/launch.mjs', import.meta.url), 'utf8')
const pinned = /const PACKAGE = '([^']+)'/.exec(launcher)?.[1]
if (plugin.version !== pkg.version) fail(`plugins/classcad plugin.json version ${plugin.version} is not ${pkg.version}`)
if (pinned !== `${pkg.name}@${pkg.version}`) fail(`plugins/classcad/launch.mjs runs ${pinned}, not ${pkg.name}@${pkg.version}`)

const toPublish = []
for (const dir of PACKAGES) {
  const { name, version } = json(`packages/${dir}/package.json`)
  const res = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2f')}/${version}`)
  if (res.status === 404) toPublish.push(dir)
  else if (!res.ok) fail(`npm answered ${res.status} for ${name}@${version}`)
  console.error(`${name}@${version}: ${res.status === 404 ? 'new' : 'already on npm'}`)
}
console.log(toPublish.join('\n'))
