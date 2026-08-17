// 13 — template with inline `base64` OFB data
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const OFB_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'

export default async function (api, { filewrite, snapshot }) {
  const tmp = `/tmp/cc-${Date.now()}.ofb`
  execSync(`curl -fsSL -o "${tmp}" "${OFB_URL}"`)
  const ofbB64 = fs.readFileSync(tmp).toString('base64')
  fs.unlinkSync(tmp)

  const r = await api.v1.assembly.from({
    data: JSON.stringify({
      templates: [
        { ident: 'Bolt_FromB64', type: 'part', base64: ofbB64 },
      ],
      instances: [{ ident: 'B', template: 'Bolt_FromB64' }],
      constraints: [],
    }),
    format: 'JSON',
  })
  console.log('[13] maxLevel:', r.maxLevel, 'errs:', JSON.stringify((r.messages ?? []).filter((m) => m.level >= 51)))
  const partNode = Object.values(r.structure.tree).find((n) => n.class === 'CC_Part')
  console.log('[13] CC_Part name:', partNode?.name, 'id:', partNode?.id)
  const inst = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'B' })).result
  console.log('[13] instance id:', inst)
  filewrite(r.messages, 'messages')

  await snapshot('base64-bolt')
  return {}
}
