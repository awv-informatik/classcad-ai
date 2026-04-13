// Delete the mirror pattern constraint — does mirrored geometry survive?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [10, 10, 0], radius: 8 })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [circle] })).result

  // Symmetry line
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [30, -10, 0], endPos: [30, 30, 0] })).result

  // Mirror
  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })
  console.log('[08] mirror result:', JSON.stringify(r.result))
  console.log('[08] geometry[0]:', r.result.geometry[0], 'geometry[1]:', r.result.geometry[1])

  await snapshot('before-delete')

  // Delete the pattern constraint
  const del = await api.v1.sketch.deleteObject({ ids: [r.result.constraint] })
  console.log('[08] delete result:', JSON.stringify(del.result))
  console.log('[08] delete maxLevel:', del.maxLevel)
  console.log('[08] delete messages:', JSON.stringify(del.messages))

  filewrite({ deleteResult: del.result, maxLevel: del.maxLevel, messages: del.messages }, 'delete-response')

  await snapshot('after-delete')

  return { partId }
}
