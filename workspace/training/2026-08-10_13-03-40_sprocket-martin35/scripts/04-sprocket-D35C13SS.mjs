/**
 * 04 — D35C13SS: DOUBLE strand, 13T, hub style C (hub both sides),
 * 5/8" bore, keyway, 1 set screw. Exercises: strand spacer at relief dia,
 * 4 tip-taper faces, symmetric hubs, small-N tooth form.
 */
import { buildSprocket } from './_build.mjs'

export default async function (api, helpers) {
  const { snapshot } = helpers
  const { spec, report } = await buildSprocket(api, helpers, {
    teeth: 13,
    strands: 2,
    hubStyle: 'C',
    bore: 0.625,
    boreChamfer: 0.03,
    keyway: true,
    setScrews: 1,
    hubProj: 0.4,
  })
  console.log('[04] built', spec.name, JSON.stringify(report.spec))
  for (const c of report.checks) console.log(`[04] check ${c.ok ? '✓' : '❌'} ${c.label}:`, JSON.stringify(c))
  await snapshot('iso')
  await snapshot('side', { view: 'front' })
  if (!report.allChecksPass) throw new Error('verification checks failed')
  return { name: spec.name }
}
