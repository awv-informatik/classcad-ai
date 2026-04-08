// 03 — genFixation=false: line from origin should NOT get auto fixation constraint
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoFix' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Line from origin with genFixation=false
  const r = await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [50, 30, 0],
    genFixation: false,
  })
  const lineId = r.result
  console.log('[03] lineId:', lineId, 'maxLevel:', r.maxLevel)

  // Dump structure to check for absence of fixation constraint
  filewrite(r.structure, 'structure-nofixation')

  // Now create another line WITH genFixation=true (default) from origin for comparison
  const r2 = await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [30, 60, 0],
  })
  console.log('[03] line2Id:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.structure, 'structure-withfixation')

  await snapshot('fixation-test')
  return { partId, skId, lineId }
}
