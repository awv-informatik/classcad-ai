export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CreateMidTree' })).result
  console.log('[04] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40, name: 'Box1' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [30, 0, 0], name: 'Cyl1' })).result
  console.log('[04] boxId:', boxId, 'cylId:', cylId)

  // Move bar before cylinder
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })

  // Try to create a new feature while bar is in the middle
  const box2r = await api.v1.part.box({ id: partId, length: 30, width: 30, height: 30, name: 'Box2', position: [-50, 0, 0] })
  console.log('[04] create Box2 at mid-tree result:', box2r.result, 'maxLevel:', box2r.maxLevel)
  filewrite({ result: box2r.result, messages: box2r.messages, maxLevel: box2r.maxLevel }, 'create-mid-tree')

  if (box2r.result) {
    await snapshot('mid-tree-created')
  }

  // Move to end — does the new feature appear? Where in the tree?
  await api.v1.part.operationMoveToEnd({ id: partId })
  await snapshot('after-moveToEnd')

  // Check structure to see where Box2 ended up
  const r = await api.v1.common.recalc()
  const ops = r.structure.tree['18']
  console.log('[04] OperationSequence children:', JSON.stringify(ops.children))

  // List features
  for (const childId of ops.children) {
    const node = r.structure.tree[String(childId)]
    if (node && node.class && node.class.startsWith('CC_')) {
      console.log('[04]  ', childId, node.class, node.name)
    }
  }

  return { partId }
}
