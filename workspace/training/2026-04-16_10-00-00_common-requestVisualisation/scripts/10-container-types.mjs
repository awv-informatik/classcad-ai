// Explore container types: solids vs curves vs work geometry
// container.type=1 for solids, type=2 for curves — what else?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisContTypes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Solid
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Cylinder (curved solid — different mesh structure?)
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 30, translation: [80, 0, 0] })).result

  // Shape with line + arc
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Mixed' })).result
  await api.v1.curve.line({ id: shapeId, startPos: [0, 60, 0], endPos: [40, 60, 0] })
  await api.v1.curve.arcBy3Points({ id: shapeId, startPos: [40, 60, 0], midPos: [50, 70, 0], endPos: [40, 80, 0] })

  // Request all at once
  const r = await api.v1.common.requestVisualisation({ ids: [boxId, cylId, shapeId] })
  console.log('[10] total containers:', r.graphic.containers.length)

  r.graphic.containers.forEach((c, i) => {
    console.log(`[10] container[${i}]: type=${c.type} id=${c.id} owner=${c.owner}`)
    console.log(`[10]   keys: ${Object.keys(c).join(', ')}`)
    console.log(`[10]   meshes: ${c.meshes?.length ?? 'none'}, edges: ${c.edges?.length ?? 'none'}, arcs: ${c.arcs?.length ?? 'none'}, vertices: ${c.vertices?.length ?? 'none'}`)
    console.log(`[10]   has lines: ${!!(c.lines && c.lines.length)}`)
  })

  filewrite(r.graphic.containers.map(c => ({
    type: c.type,
    id: c.id,
    owner: c.owner,
    keys: Object.keys(c),
    meshCount: c.meshes?.length,
    edgeCount: c.edges?.length,
    arcCount: c.arcs?.length,
    lineCount: c.lines?.length,
    vertexCount: c.vertices?.length,
  })), 'container-types')

  await snapshot('container-types')
  return { partId }
}
