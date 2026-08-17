// 08 — local OFB via reference.location — try different URI styles
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const OFB_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'

async function tryLocation(api, loc) {
  await api.v1.common.clear({})
  const r = await api.v1.assembly.from({
    data: JSON.stringify({
      templates: [{ ident: 'T', type: 'part', reference: { location: loc, type: 'ofb' } }],
      instances: [],
      constraints: [],
    }),
    format: 'JSON',
  })
  const partNode = Object.values(r.structure?.tree ?? {}).find((n) => n.class === 'CC_Part')
  return {
    loc,
    maxLevel: r.maxLevel,
    partLoaded: !!partNode,
    partName: partNode?.name ?? null,
    firstErr: (r.messages ?? []).filter((m) => m.level >= 51)[0]?.message?.slice(0, 100) ?? null,
  }
}

export default async function (api, { filewrite }) {
  const tmp = `/tmp/cc-${Date.now()}.ofb`
  execSync(`curl -fsSL -o "${tmp}" "${OFB_URL}"`)
  console.log('[08] OFB cached at:', tmp, 'size:', fs.statSync(tmp).size)

  const variants = [
    tmp,                       // bare path
    'file://' + tmp,           // file:// URI
    'file:' + tmp,             // file: scheme
    `local:${tmp}`,            // bogus scheme
    '/nonexistent/foo.ofb',    // missing file
  ]
  const out = []
  for (const v of variants) {
    const r = await tryLocation(api, v)
    out.push(r)
    console.log('[08]', JSON.stringify(r))
  }
  filewrite(out, 'results')
  fs.unlinkSync(tmp)
  return out
}
