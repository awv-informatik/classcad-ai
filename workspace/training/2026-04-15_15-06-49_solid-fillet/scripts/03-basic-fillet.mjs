// 03 — Basic fillet: fillet one edge of a box
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BasicFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[03] boxId:', boxId)

  // Get one edge ID
  const edgeR = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: 0 })
  const edgeId = edgeR.result
  console.log('[03] edgeId (lineIndex=0):', edgeId)

  // Snapshot before fillet
  await snapshot('before')

  // Fillet that edge with radius 5
  const r = await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [edgeId] })
  console.log('[03] fillet result:', r.result)
  console.log('[03] fillet maxLevel:', r.maxLevel)
  console.log('[03] fillet messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fillet-response')

  // Dump graphic data for verification
  const containers = r.graphic?.containers || []
  console.log('[03] container count after fillet:', containers.length)
  for (const c of containers) {
    console.log(`[03] container: id=${c.id}, type=${c.type}, verts=${c.vertices?.length || 0}`)
  }

  await snapshot('after')

  return { partId, eifId, boxId, edgeId, filletResult: r.result }
}
