// Test COLINEAR constraint between two lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two non-colinear lines
  const line1Id = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const line2Id = (await api.v1.sketch.line({
    id: skId, startPos: [50, 10, 0], endPos: [80, 10, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  console.log('[07] line1Id:', line1Id, 'line2Id:', line2Id)

  const r = await api.v1.sketch.constraint({
    id: skId, type: 'COLINEAR', geomIds: [line1Id, line2Id],
  })
  console.log('[07] colinear result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'colinear-response')
  await snapshot('colinear')
  return { partId }
}
