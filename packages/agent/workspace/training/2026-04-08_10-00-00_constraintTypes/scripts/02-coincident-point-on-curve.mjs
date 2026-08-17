// Test COINCIDENT constraint: point on curve — does a point snap onto a line/circle/arc?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a horizontal line and a separate point above it
  const line = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const pt = (await api.v1.sketch.point({
    id: skId, pos: [40, 30, 0],
    genFixation: false,
  })).result

  const ptPos = (await api.v1.sketch.getPositions({ id: pt })).result
  console.log('[02] BEFORE — point pos:', ptPos)

  await snapshot('before-pt-on-line')

  // COINCIDENT: point on line (curve)
  const r = await api.v1.sketch.constraint({
    id: skId, type: 'COINCIDENT', geomIds: [pt, line],
  })
  console.log('[02] COINCIDENT pt-on-line result:', r.result, 'maxLevel:', r.maxLevel)

  const ptPosAfter = (await api.v1.sketch.getPositions({ id: pt })).result
  console.log('[02] AFTER — point pos:', ptPosAfter)

  filewrite({ before: ptPos, after: ptPosAfter, result: r.result, maxLevel: r.maxLevel }, 'pt-on-line')

  await snapshot('after-pt-on-line')

  // Now test point on circle
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2 })).result

  const circ = (await api.v1.sketch.circle({
    id: skId2, centerPos: [40, 40, 0], radius: 30,
    genFixation: false,
  })).result
  const pt2 = (await api.v1.sketch.point({
    id: skId2, pos: [0, 0, 0],
    genFixation: false,
  })).result

  const pt2Pos = (await api.v1.sketch.getPositions({ id: pt2 })).result
  console.log('[02] BEFORE — pt2 pos:', pt2Pos)

  // COINCIDENT: point on circle
  const r2 = await api.v1.sketch.constraint({
    id: skId2, type: 'COINCIDENT', geomIds: [pt2, circ],
  })
  console.log('[02] COINCIDENT pt-on-circle result:', r2.result, 'maxLevel:', r2.maxLevel)

  const pt2PosAfter = (await api.v1.sketch.getPositions({ id: pt2 })).result
  console.log('[02] AFTER — pt2 pos:', pt2PosAfter)

  filewrite({ before: pt2Pos, after: pt2PosAfter, result: r2.result, maxLevel: r2.maxLevel }, 'pt-on-circle')

  return { partId }
}
