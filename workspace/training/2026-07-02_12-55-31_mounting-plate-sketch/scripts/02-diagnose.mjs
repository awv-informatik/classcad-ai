// 02 — same build as 01, but dump the batch MESSAGES and the lgsState of every constraint/
// dimension node to find what the solver rejected (eq/dim/ang batches returned 51 in 01).
import { ROUGH } from './_model.mjs'
import { buildMountingPlate } from './_build.mjs'

export default async function (api, { filewrite }) {
  const ctx = await buildMountingPlate(api, { params: ROUGH })
  console.log('[02] maxLevels:', JSON.stringify(ctx.maxLevels))
  for (const [k, msgs] of Object.entries(ctx.msgs)) {
    for (const m of msgs ?? []) if (m.level >= 41) console.log(`[02] ${k}: L${m.level} ${m.message}`)
  }
  filewrite(ctx.msgs, 'batch-messages')

  // lgsState sweep over constraint/dimension nodes + solved radii of the driven circles
  const tree = ctx.structure?.tree ?? {}
  const losers = []
  const radii = {}
  for (const [nid, n] of Object.entries(tree)) {
    const lgs = n.members?.lgsState?.value
    if (lgs === 0) losers.push({ id: nid, class: n.class, name: n.name })
    if (n.members?.radius?.value !== undefined) radii[`${n.name ?? n.class}#${nid}`] = n.members.radius.value
  }
  filewrite({ losers, radii }, 'lgs-and-radii')
  console.log('[02] lgsState=0 nodes:', losers.length)
  for (const l of losers.slice(0, 20)) console.log('   ', JSON.stringify(l))
  return { partId: ctx.partId, losers: losers.length }
}
