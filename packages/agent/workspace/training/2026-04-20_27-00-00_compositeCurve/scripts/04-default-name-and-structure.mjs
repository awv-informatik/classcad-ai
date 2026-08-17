export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructTest' })).result

  // Create a sketch with connected lines (triangle path)
  const skId = (await api.v1.part.sketch({ id: partId, name: 'TriSketch' })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [30, 40, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [30, 40, 0], endPos: [0, 0, 0] })).result

  console.log('[04] lines:', l1, l2, l3)

  // Create with default name (no name param)
  const r = await api.v1.part.compositeCurve({ id: partId, references: [l1, l2, l3] })
  console.log('[04] compositeCurve result:', r.result)
  console.log('[04] maxLevel:', r.maxLevel)

  // Inspect the structure to understand the feature tree
  filewrite(r.structure, 'structure')
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cc-response')

  await snapshot('default-name')
  return { partId, ccId: r.result }
}
