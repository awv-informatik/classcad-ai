// Test: What happens if you add constraints after fillet, then try to undo?
// Fillet adds implicit tangent constraints — what if more constraints are added?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoAfterConstraint' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Fillet corner
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  const [arcId, controlPtId, startPtId, endPtId] = f.result
  console.log('[14] fillet result:', JSON.stringify(f.result))

  // Add a dimension constraint on the arc's radius
  // Try to constrain the arc with a dimension
  const dim = await api.v1.sketch.dimension({ id: skId, geomId: arcId, dimValue: 15 })
  console.log('[14] dimension on arc:', dim.result, 'maxLevel:', dim.maxLevel, 'messages:', JSON.stringify(dim.messages))

  // Now try to undo the fillet
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
  console.log('[14] undo after constraint: result=', u.result, 'maxLevel=', u.maxLevel, 'messages=', JSON.stringify(u.messages))
  filewrite({ dimension: { result: dim.result, maxLevel: dim.maxLevel, messages: dim.messages },
              undo: { result: u.result, maxLevel: u.maxLevel, messages: u.messages } }, 'undo-after-constraint')
  await snapshot('after-undo-attempt')

  return { partId }
}
