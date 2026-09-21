// 11 — failed model truncated after the hollowing, with ONE feature removed (env DROP), to see which ingredient the
// sheet-body result depends on. DROP: rim | shroud | dish | growndish | slices | none
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const here = dirname(fileURLToPath(import.meta.url))
export default async function (api) {
  const MODEL = JSON.parse(readFileSync(join(here, '../files/model-failed-run.json'), 'utf8'))
  const drop = process.env.DROP || 'none'
  let steps = MODEL.parts.Tub.steps
  steps = steps.slice(0, steps.findIndex((s) => s.name === 'Hollow_interior') + 1)
  const union = steps.find((s) => s.name === 'Objective_and_eye_rim')
  if (drop === 'rim') union.tools = ['Objective_shroud']
  if (drop === 'shroud') union.tools = ['Eye_rim']
  if (drop === 'dish') steps = steps.filter((s) => !['Dish', 'Dished_control_deck'].includes(s.name))
  if (drop === 'growndish') { steps = steps.filter((s) => s.name !== 'Dish_grown'); delete steps.find((s) => s.name === 'Cavity').minus }
  if (drop === 'slices') for (const s of steps) if (s.planes && (s.op === 'slice' || s.name === 'Cavity')) s.planes = []
  MODEL.parts.Tub.steps = steps
  const code = readFileSync(join(here, '../files/native-under-test.js'), 'utf8')
  const logs = []; const orig = console.log
  console.log = (...a) => { logs.push(a.join(' ')) }
  try { await new (Object.getPrototypeOf(async function () {}).constructor)('MODEL', 'OUT', 'api', code)(MODEL, join(here, '../files'), api) } catch (e) { logs.push('stopped: ' + String(e.message).slice(0, 160)) }
  console.log = orig
  const vols = logs.filter((l) => l.includes('volume')).map((l) => l.replace('Tub ', ''))
  const last = Number(vols.at(-1)?.split(' ').pop()), prev = Number(vols.at(-2)?.split(' ').pop())
  console.log(`[11] DROP=${drop}: ${vols.join(' | ')} → hollowed ${last < prev - 1000}${logs.find((l) => l.startsWith('stopped')) || ''}`)
  return {}
}
