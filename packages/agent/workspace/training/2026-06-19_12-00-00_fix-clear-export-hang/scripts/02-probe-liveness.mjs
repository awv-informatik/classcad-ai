// After clear({keepIds:[part]}), is the box (grandchild) detectably dead, or a live
// shell with a dangling kernel? Determines whether an ObjExists-style guard suffices.
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'KeepTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('part', partId, 'eif', eifId, 'box', boxId)

  const c = await api.v1.common.clear({ keepIds: [partId] })
  console.log('clear keepIds=[part] maxLevel', c.maxLevel)

  // Probe each id without exporting. massprops/inspect should reject a dead id cleanly (51), not hang.
  for (const [n, idv] of [['part', partId], ['eif', eifId], ['box', boxId]]) {
    const mp = await api.v1.part.calculateMassProperties({ id: idv }).catch(e => ({ error: e.message }))
    let tree = '-'
    try { const t = await api.v1.common.inspect?.({ id: idv }); tree = JSON.stringify(t)?.slice(0,40) } catch(e) {}
    console.log(`${n}(${idv}): massprops maxLevel ${mp.maxLevel} vol ${mp.result?.volume ?? '-'} msg ${JSON.stringify((mp.messages?.[0]?.message)||mp.error||'').slice(0,55)}`)
  }
}
