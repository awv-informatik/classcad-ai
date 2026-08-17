/** 04f — is there a hard limit on @expr-bound dimensions per part? */
export default async function (api, { filewrite }) {
  const partR = await api.v1.part.create({ name: 'Limit' })
  const partId = partR.result
  const top = Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Top').id
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'dia', value: 6 }] })
  const sk = (await api.v1.sketch.create({ id: partId, planeId: top, name: 'S' })).result
  let failAt = null
  for (let i = 0; i < 48; i++) {
    const x = (i % 8) * 12, y = Math.floor(i / 8) * 12
    const c = (await api.v1.sketch.circle({ id: sk, centerPos: [x, y, 0], radius: 2.7 })).result
    const d = await api.v1.sketch.dimension({ id: sk, name: `d${i}`, type: 'DIAMETER', geomIds: [c], value: '@expr.dia' })
    if (d.maxLevel > 31) {
      console.log(`[04f] @expr dim #${i + 1} FAILED:`, JSON.stringify((d.messages ?? []).map((m) => m.message)))
      failAt = i + 1
      // control: numeric dim on the same circle
      const dn = await api.v1.sketch.dimension({ id: sk, name: `dn${i}`, type: 'RADIUS', geomIds: [c], value: 3 })
      console.log(`[04f] numeric dim after failure: maxLevel ${dn.maxLevel}`)
      break
    }
  }
  if (!failAt) console.log('[04f] 48 @expr dims all fine — no limit up to 48')
  filewrite({ failAt }, 'expr-dim-limit')
  return { failAt }
}
