// 01 — Basic box offset: create a box and offset it outward
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OffsetTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before-offset')

  // Offset outward by 5
  const r = await api.v1.solid.offset({ id: eifId, target: boxId, distance: 5 })
  console.log('[01] offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'offset-response')

  await snapshot('after-offset')

  // Dump graphic data before and after to compare vertex counts
  const graphicAfter = r.graphic
  if (graphicAfter) {
    const bodies = graphicAfter.bodies || []
    const summary = bodies.map((b, i) => ({
      bodyIndex: i,
      vertexCount: b.vertices ? b.vertices.length / 3 : 0,
      triangleCount: b.indices ? b.indices.length / 3 : 0,
    }))
    filewrite(summary, 'graphic-summary')
    console.log('[01] bodies:', summary.length, 'verts:', summary.map(s => s.vertexCount))
  }

  return { partId, eifId, boxId, offsetId: r.result }
}
