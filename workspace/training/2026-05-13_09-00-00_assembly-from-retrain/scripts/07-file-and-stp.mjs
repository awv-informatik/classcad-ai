// 07 — file: param via fetched OFB + STP type variant if available
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const OFB_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'

async function fetchToTmp(url, suffix) {
  const target = `/tmp/cc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${suffix}`
  execSync(`curl -fsSL -o "${target}" "${url}"`)
  return target
}

export default async function (api, { filewrite }) {
  const localOfb = await fetchToTmp(OFB_URL, '.ofb')
  console.log('[07] Downloaded OFB to:', localOfb, 'size:', fs.statSync(localOfb).size)

  // A: template with file reference (local OFB)
  const a = await api.v1.assembly.from({
    data: JSON.stringify({
      templates: [
        {
          ident: 'Bolt_FromFile',
          type: 'part',
          reference: { location: localOfb, type: 'ofb' },
        },
      ],
      instances: [{ ident: 'B1', template: 'Bolt_FromFile' }],
      constraints: [],
    }),
    format: 'JSON',
  })
  console.log('[A] file ref maxLevel:', a.maxLevel, 'msgs:', JSON.stringify(a.messages))
  const aNodes = Object.values(a.structure?.tree ?? {})
  const aPart = aNodes.find((n) => n.class === 'CC_Part')
  console.log('[A] part loaded:', aPart?.name)

  await api.v1.common.clear({})

  // B: same OFB, but mislabel type as "stp" — should it auto-detect or fail?
  const b = await api.v1.assembly.from({
    data: JSON.stringify({
      templates: [
        {
          ident: 'Mislabeled',
          type: 'part',
          reference: { location: localOfb, type: 'stp' },
        },
      ],
      instances: [],
      constraints: [],
    }),
    format: 'JSON',
  })
  console.log('[B] mislabeled-type maxLevel:', b.maxLevel, 'msgs:', JSON.stringify(b.messages))

  await api.v1.common.clear({})

  // C: file param at the top level (no inline JSON data)
  // First write a JSON file with the empty assembly shape
  const jsonPath = `/tmp/cc-asm-${Date.now()}.json`
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({
      templates: [
        {
          ident: 'BoltFromOuterFile',
          type: 'part',
          reference: { location: localOfb, type: 'ofb' },
        },
      ],
      instances: [{ ident: 'B1', template: 'BoltFromOuterFile' }],
      constraints: [],
    }),
  )
  const c = await api.v1.assembly.from({ file: jsonPath })
  console.log('[C] file param maxLevel:', c.maxLevel, 'msgs:', JSON.stringify(c.messages))
  const cNodes = Object.values(c.structure?.tree ?? {})
  const cPart = cNodes.find((n) => n.class === 'CC_Part')
  console.log('[C] part loaded:', cPart?.name)

  await api.v1.common.clear({})

  // D: file param without .json extension — does the auto-detect break?
  const altPath = `/tmp/cc-asm-${Date.now()}.dat`
  fs.copyFileSync(jsonPath, altPath)
  const d = await api.v1.assembly.from({ file: altPath })
  console.log('[D] .dat ext maxLevel:', d.maxLevel, 'msgs:', JSON.stringify(d.messages))

  await api.v1.common.clear({})

  // E: file param with .dat + explicit format
  const e = await api.v1.assembly.from({ file: altPath, format: 'JSON' })
  console.log('[E] .dat + format maxLevel:', e.maxLevel, 'msgs:', JSON.stringify(e.messages))

  filewrite({ a: a.messages, b: b.messages, c: c.messages, d: d.messages, e: e.messages }, 'all-messages')

  fs.unlinkSync(localOfb)
  fs.unlinkSync(jsonPath)
  fs.unlinkSync(altPath)
  return {}
}
