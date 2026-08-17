// 12 — cleanShape on an empty shape (no curves)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Empty' })).result

  // Clean without any curves
  const r = await api.v1.curve.cleanShape({ ids: [shapeId] })
  console.log('[12] cleanShape empty — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  // Shape should still exist
  const tree = r.structure.tree
  const shapeNode = tree[String(shapeId)]
  console.log('[12] shape exists after clean:', !!shapeNode)
  console.log('[12] shape name:', shapeNode?.name)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages, shapeExists: !!shapeNode }, 'cleanShape-empty')

  return {}
}
