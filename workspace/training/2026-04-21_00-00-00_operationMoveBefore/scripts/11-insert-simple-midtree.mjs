export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SimpleInsert' })).result
  console.log('[11] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40, name: 'Base' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 15, height: 60, position: [30, 20, 0], name: 'Cyl1' })).result
  const boolId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: boxId, tools: [cylId] })).result
  console.log('[11] boxId:', boxId, 'cylId:', cylId, 'boolId:', boolId)

  await snapshot('original')

  // Insert a sphere BEFORE the boolean — it should appear in the design tree before the boolean
  await api.v1.part.operationMoveBefore({ id: partId, featureId: boolId })

  const sphereId = (await api.v1.part.sphere({ id: partId, radius: 12, position: [-20, 10, 20], name: 'InsertedSphere' })).result
  console.log('[11] sphereId (inserted mid-tree):', sphereId)

  await snapshot('with-sphere-before-bool')

  // moveToEnd — sphere + boolean both active
  await api.v1.part.operationMoveToEnd({ id: partId })
  await snapshot('all-restored')

  // Check operation sequence order
  const r = await api.v1.common.recalc()
  const ops = r.structure.tree['18']
  console.log('[11] Operation sequence:')
  for (const childId of ops.children) {
    const node = r.structure.tree[String(childId)]
    if (node && node.class && (node.class.startsWith('CC_') && node.class !== 'CC_OperationSequence')) {
      console.log('[11]  ', childId, node.class, node.name)
    }
  }

  return { partId }
}
