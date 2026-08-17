export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoChangeTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 15, height: 50 })).result
  console.log('[04] partId:', partId, 'boxId:', boxId, 'cylId:', cylId)

  // Move bar backward
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })

  // Open feature but don't change anything
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.closeFeature({ id: boxId })
  console.log('[04] opened and closed box without changes')

  // moveToEnd — no changes were made
  const r = await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[04] moveToEnd no changes — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'moveToEnd-no-changes')

  await snapshot('after-moveToEnd')

  return { partId }
}
