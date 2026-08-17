// Test FIXATION constraint on a point and on a line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [10, 10, 0],
    endPos: [60, 40, 0],
    genFixation: false,
    genVertAndHoriz: false,
  })).result
  console.log('[06] lineId:', lineId)

  // getPoints takes geometry ID directly
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  console.log('[06] points:', JSON.stringify(pts))

  // Fix a point
  const r1 = await api.v1.sketch.constraint({
    id: skId,
    type: 'FIXATION',
    geomIds: [pts.startId],
  })
  console.log('[06] fix point result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Fix the whole line
  const r2 = await api.v1.sketch.constraint({
    id: skId,
    type: 'FIXATION',
    geomIds: [lineId],
  })
  console.log('[06] fix line result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    fixPoint: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    fixLine: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
  }, 'fixation-response')

  await snapshot('fixation')
  return { partId }
}
