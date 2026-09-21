// 09 — the failed model, truncated after the hollowing step, with ONE parameter (env FLIP) set to its working value.
// Reports whether the hollowing removed material. FLIP=none is the control.
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const here = dirname(fileURLToPath(import.meta.url))
export default async function (api, { filewrite }) {
  const MODEL = JSON.parse(readFileSync(join(here, '../files/model-failed-run.json'), 'utf8'))
  const diff = JSON.parse(readFileSync(join(here, '../files/param-diff.json'), 'utf8'))
  const flips = (process.env.FLIP || 'none').split(',').filter((k) => k !== 'none')
  for (const k of flips) MODEL.parameters[k] = diff[k][1]
  const steps = MODEL.parts.Tub.steps
  MODEL.parts.Tub.steps = steps.slice(0, steps.findIndex((s) => s.name === 'Hollow_interior') + 1)
  const code = readFileSync(join(here, '../files/native-under-test.js'), 'utf8')
  const logs = []
  const orig = console.log
  console.log = (...a) => { logs.push(a.join(' ')); orig(...a) }
  try { await new (Object.getPrototypeOf(async function () {}).constructor)('MODEL', 'OUT', 'api', code)(MODEL, join(here, '../files'), api) } catch (e) { logs.push('stopped: ' + String(e.message).slice(0, 160)) }
  console.log = orig
  const v = (n) => Number((logs.find((l) => l.includes(n)) || '').split(' ').pop())
  const before = v('Dished_control_deck'), after = v('Hollow_interior')
  console.log(`[09] FLIP=${flips.join(',') || 'none'} before ${before} after ${after} hollowed ${after < before - 1000}`)
  return {}
}
