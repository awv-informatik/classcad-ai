/** 02 (variant A) — D35C13SS: double strand, style C, via solid.* */
import { buildSolidSprocket } from './_buildA.mjs'

export default async function (api, helpers) {
  const { snapshot } = helpers
  const { report } = await buildSolidSprocket(api, helpers, {
    teeth: 13, strands: 2, hubStyle: 'C', bore: 0.625, boreChamfer: 0.03, keyway: true, setScrews: 1, hubProj: 0.4,
  })
  for (const c of report.checks) console.log(`[02A] ${c.ok ? '✓' : '❌'}`, JSON.stringify(c))
  await snapshot('iso')
  if (!report.allChecksPass) throw new Error('checks failed')
  return { name: report.name }
}
