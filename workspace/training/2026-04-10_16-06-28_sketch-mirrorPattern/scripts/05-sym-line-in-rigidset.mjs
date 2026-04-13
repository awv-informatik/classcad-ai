// Edge case: symmetry line is part of the rigid set being mirrored
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an L-shape and a line that will be both in the set AND the symmetry line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [20, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [20, 20, 0] })).result
  // This vertical line will serve as symmetry axis AND be in the rigid set
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [20, -10, 0], endPos: [20, 30, 0] })).result

  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2, symLine] })).result

  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })
  console.log('[05] result:', JSON.stringify(r.result))
  console.log('[05] maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'sym-in-set')

  await snapshot('sym-in-set')
  return { partId }
}
