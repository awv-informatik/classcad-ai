export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FacesTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Box: L=80(X), W=60(Y), H=40(Z)
  // Faces use `positions` (plural, array of points) not `pos` (singular)

  // Top face: Z=40, center at [40, 30, 40]
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],
  })
  console.log('[02] top face (single pos):', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Bottom face: Z=0, center at [40, 30, 0]
  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 0]] }],
  })
  console.log('[02] bottom face:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Front face: Y=0, center at [40, 0, 20]
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 0, 20]] }],
  })
  console.log('[02] front face:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  // Multiple faces in one call
  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [
      { positions: [[40, 30, 40]] },  // top
      { positions: [[40, 30, 0]] },   // bottom
      { positions: [[40, 0, 20]] },   // front
      { positions: [[0, 30, 20]] },   // left (X=0)
      { positions: [[80, 30, 20]] },  // right (X=80)
      { positions: [[40, 60, 20]] },  // back (Y=60)
    ],
  })
  console.log('[02] all 6 faces:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)
  filewrite(r4, 'all-faces-response')

  // Try with multiple positions per face (edge midpoints pattern from docs)
  const r5 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[0, 30, 40], [40, 0, 40]] }],  // midpoints of 2 edges of top face
  })
  console.log('[02] top face (2 edge midpoints):', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)

  await snapshot('box-faces')
  return { partId }
}
