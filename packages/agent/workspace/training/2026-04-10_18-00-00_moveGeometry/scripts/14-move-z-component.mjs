// 14 — Move with Z component (sketch is on XY plane — Z should be ignored or cause error?)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [50, 10, 0] })).result

  const before = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[14] before:', JSON.stringify(before))

  // Try moving with Z component
  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [lineId], translation: [10, 10, 50] })
  console.log('[14] moveGeometry with Z result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[14] messages:', JSON.stringify(r.messages))

  const after = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[14] after:', JSON.stringify(after))
  console.log('[14] Z changed?', before.startPos.z !== after.startPos.z)

  filewrite({ before, after, moveResult: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'z-component')

  return { partId }
}
