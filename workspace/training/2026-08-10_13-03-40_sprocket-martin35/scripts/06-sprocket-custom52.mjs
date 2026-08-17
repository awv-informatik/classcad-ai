/**
 * 06 — custom tooth-count mode: 52T (outside the 10..45 catalog table →
 * maxHub interpolation fallback), single strand, style B, 2" bore,
 * 1/2×1/4 keyway, 2 set screws, explicit hub dia.
 */
import { buildSprocket } from './_build.mjs'

export default async function (api, helpers) {
  const { snapshot } = helpers
  const { spec, report } = await buildSprocket(api, helpers, {
    teeth: 52,
    customMode: true,
    strands: 1,
    hubStyle: 'B',
    bore: 2.0,
    boreChamfer: 0.03,
    keyway: true,
    setScrews: 2,
    hubDia: 4.5,
    hubProj: 0.6,
  })
  console.log('[06] built', spec.name, JSON.stringify(report.spec))
  for (const c of report.checks) console.log(`[06] check ${c.ok ? '✓' : '❌'} ${c.label}:`, JSON.stringify(c))
  await snapshot('iso')
  await snapshot('face', { view: 'right' })
  if (!report.allChecksPass) throw new Error('verification checks failed')
  return { name: spec.name }
}
