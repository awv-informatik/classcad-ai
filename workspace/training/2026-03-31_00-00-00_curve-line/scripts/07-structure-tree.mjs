export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructPart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'TestLines' })).result

  // Add first line
  const r1 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })

  // Search structure tree for shape node
  const findNode = (node, targetId) => {
    if (!node) return null
    if (node.id === targetId) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, targetId)
        if (found) return found
      }
    }
    return null
  }

  const shapeNode1 = findNode(r1.structure, shapeId)
  console.log('[07] after 1 line - geometryIdList:', JSON.stringify(shapeNode1?.geometryIdList))
  console.log('[07] after 1 line - keys:', shapeNode1 ? Object.keys(shapeNode1).join(', ') : 'null')

  // Add second line
  const r2 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [0, 50, 0] })
  const shapeNode2 = findNode(r2.structure, shapeId)
  console.log('[07] after 2 lines - geometryIdList:', JSON.stringify(shapeNode2?.geometryIdList))

  // Add third line
  const r3 = await api.v1.curve.line({ id: shapeId, startPos: [50, 0, 0], endPos: [0, 50, 0] })
  const shapeNode3 = findNode(r3.structure, shapeId)
  console.log('[07] after 3 lines - geometryIdList:', JSON.stringify(shapeNode3?.geometryIdList))

  filewrite({
    after1: { geometryIdList: shapeNode1?.geometryIdList, members: shapeNode1?.members },
    after2: { geometryIdList: shapeNode2?.geometryIdList },
    after3: { geometryIdList: shapeNode3?.geometryIdList },
  }, 'structure-changes')

  await snapshot('three-lines')
  return { partId, shapeId }
}
