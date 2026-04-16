// 16 — Verify parametric link with numeric data (graphic vertex counts/bounds)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ParamData' })).result

  // Create a part-level box (80x60x40)
  const boxFeat = (await api.v1.part.box({ id: partId, name: 'SrcBox', length: 80, width: 60, height: 40 })).result

  // useSolid into EI
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI' })).result
  const r = await api.v1.solid.useSolid({ from: [boxFeat], in: eifId })
  const usedId = r.result[0]
  console.log('[16] useSolid ID:', usedId)

  // Separate the used solid so we can see both — translate the copy aside
  await api.v1.solid.translation({ id: eifId, target: usedId, translation: [120, 0, 0] })

  // Capture graphic data BEFORE update
  const snapBefore = await snapshot('before-update')
  // Get graphic from a call
  const gBefore = (await api.v1.common.recalc({}))
  filewrite(gBefore.graphic, 'graphic-before')

  // Now update the source box height to 100
  await api.v1.part.openFeature({ id: boxFeat })
  await api.v1.part.updateBox({ id: boxFeat, height: 100 })
  await api.v1.part.closeFeature({ id: boxFeat })
  await api.v1.common.recalc({})

  // Capture graphic data AFTER update
  const gAfter = (await api.v1.common.recalc({}))
  filewrite(gAfter.graphic, 'graphic-after')

  await snapshot('after-update')

  // Compare: count vertices per body in before vs after
  if (gBefore.graphic && gAfter.graphic) {
    const bodiesBefore = gBefore.graphic.bodies || []
    const bodiesAfter = gAfter.graphic.bodies || []
    console.log('[16] bodies before:', bodiesBefore.length, 'after:', bodiesAfter.length)

    for (let i = 0; i < bodiesAfter.length; i++) {
      const b = bodiesAfter[i]
      const verts = b.mesh?.vertices || []
      const vertCount = verts.length / 3
      console.log('[16] body', i, 'id:', b.id, 'vertices:', vertCount)

      // Find bounding box from vertices
      if (verts.length > 0) {
        let minX = Infinity, maxX = -Infinity
        let minY = Infinity, maxY = -Infinity
        let minZ = Infinity, maxZ = -Infinity
        for (let j = 0; j < verts.length; j += 3) {
          minX = Math.min(minX, verts[j]); maxX = Math.max(maxX, verts[j])
          minY = Math.min(minY, verts[j+1]); maxY = Math.max(maxY, verts[j+1])
          minZ = Math.min(minZ, verts[j+2]); maxZ = Math.max(maxZ, verts[j+2])
        }
        console.log('[16] body', i, 'bbox:', {
          x: [minX.toFixed(1), maxX.toFixed(1)],
          y: [minY.toFixed(1), maxY.toFixed(1)],
          z: [minZ.toFixed(1), maxZ.toFixed(1)],
          dims: [(maxX-minX).toFixed(1), (maxY-minY).toFixed(1), (maxZ-minZ).toFixed(1)]
        })
      }
    }
  }

  return { usedId }
}
