// Test: deleting constraints and dimensions (proper geomIds parameter)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelConstraints' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 20, 0], endPos: [60, 20, 0] })).result
  console.log('[02] line1:', line1, 'line2:', line2)

  // Create a FIXATION constraint on line1
  const constr = (await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [line1] })).result
  console.log('[02] constraint ID:', constr)

  // Create an OFFSET dimension on line1 (measures length)
  const dim = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [line1] })).result
  console.log('[02] dimension ID:', dim)

  await snapshot('before-delete')

  // Delete the constraint
  const r1 = await api.v1.sketch.deleteObject({ ids: [constr] })
  console.log('[02] delete constraint result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'delete-constraint-response')

  // Delete the dimension
  const r2 = await api.v1.sketch.deleteObject({ ids: [dim] })
  console.log('[02] delete dimension result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'delete-dimension-response')

  await snapshot('after-delete-constraint-dim')

  return { partId }
}
