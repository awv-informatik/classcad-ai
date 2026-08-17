// Test: Pass part ID instead of sketch ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const geo = await api.v1.sketch.geometry({
    id: skId,
    lines: [{ startPos: [0, 0, 0], endPos: [50, 0, 0] }],
    genFixation: false,
    genVertAndHoriz: false,
  })
  const lineId = geo.result.lines[0]
  console.log('[18] created line:', lineId, 'partId:', partId, 'skId:', skId)

  // Try update with partId
  const r = await api.v1.sketch.updateGeometry({
    id: partId,
    lines: [{ id: lineId, startPos: [10, 10, 0], endPos: [60, 10, 0] }],
  })
  console.log('[18] partId result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[18] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'part-id-response')

  return { partId }
}
