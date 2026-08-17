export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 30 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 15, height: 50 })).result
  console.log('[03] partId:', partId, 'boxId:', boxId, 'cylId:', cylId)

  await snapshot('initial')

  // Move bar before cylinder
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })

  // Open box and change its height via updateBox
  await api.v1.part.openFeature({ id: boxId })
  const upd = await api.v1.part.updateBox({ id: boxId, height: 80 })
  console.log('[03] updateBox height=80 — result:', upd.result, 'maxLevel:', upd.maxLevel)
  filewrite({ result: upd.result, messages: upd.messages, maxLevel: upd.maxLevel }, 'updateBox-result')
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-update-mid-tree')

  // moveToEnd — docs say "If changes on a feature have been made, a recalculation will be made"
  const r = await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[03] moveToEnd after update — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'moveToEnd-after-update')

  await snapshot('after-moveToEnd')

  return { partId }
}
