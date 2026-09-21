// 10 — failed model truncated right after the hollowing: export the state (snapshot writes STEP) for an independent OCC
// measurement, and read the native volume both from the part and from the feature-owned solid.
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const here = dirname(fileURLToPath(import.meta.url))
export default async function (api, { snapshot, filewrite }) {
  const MODEL = JSON.parse(readFileSync(join(here, '../files/model-failed-run.json'), 'utf8'))
  if (process.env.FLIP) MODEL.parameters.eye_y = 12.4
  const steps = MODEL.parts.Tub.steps
  MODEL.parts.Tub.steps = steps.slice(0, steps.findIndex((s) => s.name === 'Hollow_interior') + 1)
  const code = readFileSync(join(here, '../files/native-under-test.js'), 'utf8')
  const tag = process.env.FLIP ? 'working' : 'failing'
  try { await new (Object.getPrototypeOf(async function () {}).constructor)('MODEL', 'OUT', 'api', code)(MODEL, join(here, '../files'), api) } catch (e) { console.log('[10] stopped:', String(e.message).slice(0, 200)) }
  const tree = await api.tree({ refresh: true })
  const solids = Object.values(tree).filter((n) => n.class === 'CC_Solid')
  const hollow = Object.values(tree).find((n) => n.name === 'Hollow_interior')
  console.log(`[10] ${tag}: solids in tree ${solids.length}; Hollow_interior node ${hollow?.id} class ${hollow?.class} children ${JSON.stringify(hollow?.children)}`)
  for (const s of solids) {
    const r = await api.v1.part.calculateMassProperties({ id: s.id }).catch((e) => ({ result: null, err: String(e.message).slice(0, 120) }))
    console.log(`[10] ${tag}: solid ${s.id} parent ${s.parent} (${tree[s.parent]?.name}) volume ${r.result?.volume ?? r.err}`)
  }
  await snapshot(tag + '-after-hollow', { section: { origin: [57, 19, 15], normal: [0, 1, 0] } })
  return {}
}
