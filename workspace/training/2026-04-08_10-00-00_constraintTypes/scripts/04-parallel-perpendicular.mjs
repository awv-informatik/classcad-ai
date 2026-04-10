// Test PARALLEL and PERPENDICULAR constraints between lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // l1: fixed horizontal reference, l2: angled line to be made parallel
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  // Fix l1 so it doesn't move
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 30, 0], endPos: [60, 50, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const l2Before = await getLinePositions(api, l2)
  console.log('[04] l2 BEFORE parallel:', l2Before)

  const rP = await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [l1, l2] })
  console.log('[04] PARALLEL result:', rP.result, 'maxLevel:', rP.maxLevel)

  const l2After = await getLinePositions(api, l2)
  console.log('[04] l2 AFTER parallel:', l2After)

  // l3: angled line to be made perpendicular to l1
  const l3 = (await api.v1.sketch.line({
    id: skId, startPos: [70, 0, 0], endPos: [100, 30, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const l3Before = await getLinePositions(api, l3)

  const rPerp = await api.v1.sketch.constraint({ id: skId, type: 'PERPENDICULAR', geomIds: [l1, l3] })
  console.log('[04] PERPENDICULAR result:', rPerp.result, 'maxLevel:', rPerp.maxLevel)

  const l3After = await getLinePositions(api, l3)
  console.log('[04] l3 BEFORE perp:', l3Before)
  console.log('[04] l3 AFTER perp:', l3After)

  filewrite({
    parallel: { before: l2Before, after: l2After, result: rP.result },
    perpendicular: { before: l3Before, after: l3After, result: rPerp.result },
  }, 'parallel-perp-data')

  await snapshot('result')
  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}
