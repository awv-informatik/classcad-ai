// Check the initial dimPt expression pattern before updateDimensionPosition
// The first script showed it starts as "GetSE([0,0,8,[0,0.5]])" and changes to "{x,y,z}"
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Create several dimension types and check their initial dimPt expressions
  const offR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })
  const offNode = offR.structure.tree[String(offR.result)]
  console.log('[16] OFFSET initial dimPt:', JSON.stringify(offNode?.members?.dimPt))

  const hR = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [rectIds[2]] })
  const hNode = hR.structure.tree[String(hR.result)]
  console.log('[16] HDIST initial dimPt:', JSON.stringify(hNode?.members?.dimPt))

  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 15 })).result
  const radR = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circId] })
  const radNode = radR.structure.tree[String(radR.result)]
  console.log('[16] RADIUS initial dimPt:', JSON.stringify(radNode?.members?.dimPt))

  filewrite({
    offset: offNode?.members?.dimPt,
    hdist: hNode?.members?.dimPt,
    radius: radNode?.members?.dimPt,
  }, 'initial-expressions')

  return {}
}
