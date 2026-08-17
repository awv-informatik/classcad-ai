/**
 * 05 — T35A40SS: TRIPLE strand, 40T, hub style A (flat, no hub),
 * 1.5" bore + keyway, no set screws (auto-skipped without a hub).
 */
import { buildSprocket } from './_build.mjs'

export default async function (api, helpers) {
  const { snapshot } = helpers
  const { spec, report } = await buildSprocket(api, helpers, {
    teeth: 40,
    strands: 3,
    hubStyle: 'A',
    bore: 1.5,
    boreChamfer: 0.03,
    keyway: true,
    setScrews: 2, // must be auto-skipped: style A has no hub wall
  })
  console.log('[05] built', spec.name, JSON.stringify(report.spec))
  for (const c of report.checks) console.log(`[05] check ${c.ok ? '✓' : '❌'} ${c.label}:`, JSON.stringify(c))
  if (spec.screws.length) throw new Error('style A must not get set screws')
  await snapshot('iso')
  await snapshot('side', { view: 'front' })
  if (!report.allChecksPass) throw new Error('verification checks failed')
  return { name: spec.name }
}
