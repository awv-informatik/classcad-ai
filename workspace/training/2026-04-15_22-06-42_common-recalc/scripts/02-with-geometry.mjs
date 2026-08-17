// Test recalc with geometry present — compare structure/graphic before and after
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[02] boxId:', boxId)

  // Capture structure before recalc
  const beforeR = await api.v1.solid.box({ id: eifId, length: 1, width: 1, height: 1 })
  // Actually, let's just read the state via a no-op query
  const before = await api.v1.common.getAppVersion({})
  filewrite({ structureKeys: Object.keys(before.structure || {}), hasGraphic: !!before.graphic }, 'before-state')

  // Now recalc
  const r = await api.v1.common.recalc()
  console.log('[02] recalc result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'recalc-result')

  // Capture state after recalc
  const after = await api.v1.common.getAppVersion({})
  filewrite({ structureKeys: Object.keys(after.structure || {}), hasGraphic: !!after.graphic }, 'after-state')

  await snapshot('after-recalc')
  return { boxId, result: r.result, maxLevel: r.maxLevel }
}
