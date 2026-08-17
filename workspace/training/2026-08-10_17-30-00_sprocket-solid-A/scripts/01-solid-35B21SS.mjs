/** 01 (variant A) — 35B21SS via solid.* direct modeling, full feature set. */
import { buildSolidSprocket } from './_buildA.mjs'

export default async function (api, helpers) {
  const { snapshot } = helpers
  const { spec, report } = await buildSolidSprocket(api, helpers, {
    teeth: 21, strands: 1, hubStyle: 'B', bore: 1.0, boreChamfer: 0.03, keyway: true, setScrews: 2,
  })
  for (const c of report.checks) console.log(`[01A] ${c.ok ? '✓' : '❌'}`, JSON.stringify(c))
  await snapshot('iso')
  await snapshot('face', { view: 'right' })
  if (!report.allChecksPass) throw new Error('checks failed')
  return { name: report.name }
}
