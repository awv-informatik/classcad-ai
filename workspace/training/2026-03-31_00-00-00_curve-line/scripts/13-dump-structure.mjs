export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DumpStruct' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  console.log('[13] partId:', partId, 'eifId:', eifId, 'shapeId:', shapeId)

  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const r = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [0, 50, 0] })

  // Dump the full structure tree
  filewrite(r.structure, 'full-structure')

  // Check if structure is the root node directly
  console.log('[13] structure type:', typeof r.structure)
  console.log('[13] structure is array:', Array.isArray(r.structure))
  if (r.structure) {
    console.log('[13] structure keys:', Object.keys(r.structure).join(', '))
    console.log('[13] structure.id:', r.structure.id)
    console.log('[13] structure.name:', r.structure.name)
    console.log('[13] has children:', !!r.structure.children)
    if (r.structure.children) {
      console.log('[13] children count:', r.structure.children.length)
      for (const c of r.structure.children) {
        console.log('[13]   child:', c.name, 'id:', c.id, 'class:', c.class)
        if (c.children) {
          for (const cc of c.children) {
            console.log('[13]     grandchild:', cc.name, 'id:', cc.id, 'class:', cc.class, 'geoIdList:', JSON.stringify(cc.geometryIdList))
          }
        }
      }
    }
  }

  await snapshot('for-structure')
  return { partId, shapeId }
}
