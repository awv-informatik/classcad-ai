// 09 — non-location reference shapes: data base64, id of an existing template
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const OFB_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'

async function tryRef(api, ref) {
  await api.v1.common.clear({})
  const r = await api.v1.assembly.from({
    data: JSON.stringify({
      templates: [{ ident: 'T', type: 'part', reference: ref }],
      instances: [],
      constraints: [],
    }),
    format: 'JSON',
  })
  const partNode = Object.values(r.structure?.tree ?? {}).find((n) => n.class === 'CC_Part')
  return {
    ref: typeof ref === 'object' && ref.data ? { ...ref, data: `<base64:${ref.data.length}b>` } : ref,
    maxLevel: r.maxLevel,
    partLoaded: !!partNode,
    partName: partNode?.name ?? null,
    firstErr: (r.messages ?? []).filter((m) => m.level >= 51)[0]?.message?.slice(0, 120) ?? null,
  }
}

export default async function (api, { filewrite }) {
  const tmp = `/tmp/cc-${Date.now()}.ofb`
  execSync(`curl -fsSL -o "${tmp}" "${OFB_URL}"`)
  const ofbB64 = fs.readFileSync(tmp).toString('base64')

  // A: data field with base64 OFB
  const a = await tryRef(api, { data: ofbB64, type: 'ofb' })
  console.log('[09 A] data base64:', JSON.stringify(a))

  // B: data with encoding: base64
  const b = await tryRef(api, { data: ofbB64, type: 'ofb', encoding: 'base64' })
  console.log('[09 B] data + encoding:', JSON.stringify(b))

  // C: id-based ref to an already-loaded template (must load it first then re-use)
  await api.v1.common.clear({})
  // Pre-load a part template via loadProduct
  const lp = await api.v1.assembly.loadProduct({ data: ofbB64, format: 'OFB', encoding: 'base64' })
  console.log('[09 C] pre-loaded template id:', lp.result?.id ?? lp.result, 'maxLevel:', lp.maxLevel)
  // Then try `from` referencing the loaded template by id
  const tplId = lp.result?.id ?? lp.result
  const c = await api.v1.assembly.from({
    data: JSON.stringify({
      templates: [{ ident: 'Reuse', type: 'part', reference: { id: tplId } }],
      instances: [{ ident: 'I', template: 'Reuse' }],
      constraints: [],
    }),
    format: 'JSON',
  })
  console.log('[09 C] id-ref maxLevel:', c.maxLevel, 'first err:', (c.messages ?? [])[0]?.message?.slice(0, 120))

  filewrite({ a, b, c: { maxLevel: c.maxLevel, msgs: c.messages } }, 'results')
  fs.unlinkSync(tmp)
  return {}
}
