// Mirror across a diagonal symmetry line (45 degrees through origin)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle in the upper-left quadrant
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [5, 20, 0], endPos: [15, 35, 0] })).result
  console.log('[04] rectangle:', JSON.stringify(rect))

  // Create rigid set from rectangle geometry
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: Array.isArray(rect) ? rect : [rect] })).result

  // 45-degree diagonal line through origin
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [-10, -10, 0], endPos: [40, 40, 0] })).result

  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })
  console.log('[04] result:', JSON.stringify(r.result))
  console.log('[04] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'diagonal-mirror')

  await snapshot('diagonal-mirror')
  return { partId }
}
