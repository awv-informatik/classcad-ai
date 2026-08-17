export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylWrongType' })).result

  // Create a BOX feature
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  console.log('[14] boxId:', boxId)

  // Try updateCylinder on a box feature — per box.md, shared params may silently apply
  await api.v1.part.openFeature({ id: boxId })
  const r = await api.v1.part.updateCylinder({ id: boxId, height: 200, diameter: 100 })
  console.log('[14] updateCylinder on box result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[14] updateCylinder on box msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'wrong-type')
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-wrong-type')
  return { partId, boxId }
}
