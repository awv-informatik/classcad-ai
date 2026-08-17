export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 100, width: 80, height: 50 })).result
  console.log('[13] boxId:', boxId)

  // Get brep geometry from the part
  const brepIdx = (await api.v1.part.getBrepGeometryIndex({ id: partId })).result
  if (!brepIdx) {
    console.log('[13] no brep geometry found, skipping fillet test')
    return { partId }
  }

  const edges = brepIdx.filter(item => item.type === 1)
  console.log('[13] edges count:', edges.length)

  if (edges.length > 0) {
    const edgeId = edges[0].id
    console.log('[13] fillet edge:', edgeId)

    const filletId = (await api.v1.part.fillet({ id: partId, edges: [{ id: edgeId, radius: 8 }] })).result
    console.log('[13] filletId:', filletId)

    await snapshot('before-with-fillet')

    // Now delete the box — what happens to the fillet that references box edges?
    const r = await api.v1.part.deleteFeature({ ids: [boxId] })
    console.log('[13] delete box (fillet depends on it) — result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[13] messages:', JSON.stringify(r.messages))

    filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-with-fillet')

    await snapshot('after-delete-box')

    // Is the fillet also gone?
    const filletCheck = await api.v1.part.getFeature({ id: partId, name: 'Fillet' })
    console.log('[13] fillet after box delete:', filletCheck.result, 'maxLevel:', filletCheck.maxLevel)
  }

  return { partId }
}
