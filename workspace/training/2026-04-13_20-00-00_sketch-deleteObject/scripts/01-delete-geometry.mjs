// Test: basic deletion of sketch geometry (line, circle)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create some geometry
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 50, 0] })).result
  const circ = (await api.v1.sketch.circle({ id: skId, centerPos: [80, 30, 0], radius: 15 })).result

  console.log('[01] created: line1=', line1, 'line2=', line2, 'circ=', circ)
  await snapshot('before-delete')

  // Delete line1 only
  const r1 = await api.v1.sketch.deleteObject({ ids: [line1] })
  console.log('[01] delete line1 result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'delete-line1-response')

  await snapshot('after-delete-line1')

  // Delete circle
  const r2 = await api.v1.sketch.deleteObject({ ids: [circ] })
  console.log('[01] delete circ result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'delete-circ-response')

  await snapshot('after-delete-circ')

  return { partId }
}
