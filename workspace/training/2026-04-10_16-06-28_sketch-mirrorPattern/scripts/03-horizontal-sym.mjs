// Mirror across a horizontal symmetry line (y=0)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry above the X axis
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [30, 10, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [30, 10, 0], endPos: [30, 30, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [30, 30, 0], endPos: [10, 10, 0] })).result

  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2, l3] })).result

  // Horizontal symmetry line along X axis
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [-10, 0, 0], endPos: [50, 0, 0] })).result

  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })
  console.log('[03] result:', JSON.stringify(r.result))
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] geometry length:', r.result?.geometry?.length)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'horizontal-mirror')

  await snapshot('horizontal-mirror')
  return { partId }
}
