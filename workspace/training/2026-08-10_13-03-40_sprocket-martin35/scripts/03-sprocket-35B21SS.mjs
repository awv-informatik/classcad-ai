/**
 * 03 — full build: Martin 35B21SS — single strand, 21T, hub style B,
 * 1" bore + chamfer, ASME B17.1 keyway, 2 set screws, tip taper, mate CSys.
 */
import { buildSprocket } from './_build.mjs'

export default async function (api, helpers) {
  const { snapshot } = helpers
  const { spec, report } = await buildSprocket(api, helpers, {
    teeth: 21,
    strands: 1,
    hubStyle: 'B',
    bore: 1.0,
    boreChamfer: 0.03,
    keyway: true,
    setScrews: 2,
  })
  console.log('[03] built', spec.name, JSON.stringify(report.spec))
  for (const s of report.steps) console.log('[03] step:', JSON.stringify(s))
  for (const c of report.checks) console.log(`[03] check ${c.ok ? '✓' : '❌'} ${c.label}:`, JSON.stringify(c))
  await snapshot('iso')
  await snapshot('face', { view: 'right' })
  await snapshot('side', { view: 'front' })
  if (!report.allChecksPass) throw new Error('verification checks failed')
  return { name: spec.name, checks: report.checks.length }
}
