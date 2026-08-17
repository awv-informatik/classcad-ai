// 14 — Can you rename a shape with setObjectName?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Original' })).result

  console.log('[14] shapeId:', shapeId)

  // Rename it
  const r = await api.v1.common.setObjectName({ id: shapeId, name: 'Renamed' })
  console.log('[14] setObjectName result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[14] messages:', JSON.stringify(r.messages))

  // Check the name
  const tree = r.structure.tree
  const name = tree[String(shapeId)]?.name
  console.log('[14] name after rename:', name)

  filewrite({ result: r.result, maxLevel: r.maxLevel, nameAfter: name }, 'rename-result')

  return {}
}
