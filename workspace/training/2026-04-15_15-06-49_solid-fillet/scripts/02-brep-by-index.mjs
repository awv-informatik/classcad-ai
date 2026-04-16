// 02 — Use getBrepGeometryByIndex to enumerate brep edges of a box
// A box has 12 edges (all lines). Enumerate lineIndex 0..11.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletBrepIndex' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[02] boxId:', boxId)

  // Enumerate line edges: a box has 12 straight edges
  const edgeIds = []
  for (let i = 0; i < 20; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    if (r.result && r.maxLevel <= 31) {
      edgeIds.push(r.result)
      console.log(`[02] lineIndex=${i} → edgeId=${r.result}`)
    } else {
      console.log(`[02] lineIndex=${i} → VOID/error (maxLevel=${r.maxLevel})`)
      break
    }
  }

  console.log('[02] total edges found:', edgeIds.length)
  console.log('[02] edge IDs:', JSON.stringify(edgeIds))

  // Also try getting point/vertex indices
  const pointIds = []
  for (let i = 0; i < 12; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, pointIndex: i })
    if (r.result && r.maxLevel <= 31) {
      pointIds.push(r.result)
    } else {
      break
    }
  }
  console.log('[02] vertex count:', pointIds.length)

  filewrite({ boxId, edgeIds, edgeCount: edgeIds.length, pointIds, pointCount: pointIds.length }, 'brep-index-results')

  await snapshot('box')

  return { partId, eifId, boxId, edgeIds }
}
