export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DirTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeRegion(x, w, h) {
    const sk = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const lines = (await api.v1.sketch.rectangle({ id: sk, startPos: [x, 0, 0], endPos: [x + w, h, 0] })).result
    return (await api.v1.sketch.sketchRegion({ id: sk, geomIds: lines })).result
  }

  // CUSTOM with vertical direction [0,0,1] (same as UP)
  const r1 = await makeRegion(0, 30, 30)
  const e1 = await api.v1.part.extrusion({
    id: partId, name: 'DirZ', references: [r1],
    type: 'CUSTOM', direction: [0, 0, 1], limit1: 0, limit2: 50
  })
  console.log('[08] dir [0,0,1]:', e1.result, 'maxLevel:', e1.maxLevel)

  // CUSTOM with diagonal direction [1,0,1]
  const r2 = await makeRegion(50, 30, 30)
  const e2 = await api.v1.part.extrusion({
    id: partId, name: 'DirDiag', references: [r2],
    type: 'CUSTOM', direction: [1, 0, 1], limit1: 0, limit2: 50
  })
  console.log('[08] dir [1,0,1]:', e2.result, 'maxLevel:', e2.maxLevel)

  // CUSTOM with horizontal direction [1,0,0]
  const r3 = await makeRegion(100, 30, 30)
  const e3 = await api.v1.part.extrusion({
    id: partId, name: 'DirX', references: [r3],
    type: 'CUSTOM', direction: [1, 0, 0], limit1: 0, limit2: 50
  })
  console.log('[08] dir [1,0,0]:', e3.result, 'maxLevel:', e3.maxLevel)

  // CUSTOM with negative direction [0,0,-1] (same as DOWN?)
  const r4 = await makeRegion(150, 30, 30)
  const e4 = await api.v1.part.extrusion({
    id: partId, name: 'DirNZ', references: [r4],
    type: 'CUSTOM', direction: [0, 0, -1], limit1: 0, limit2: 50
  })
  console.log('[08] dir [0,0,-1]:', e4.result, 'maxLevel:', e4.maxLevel)

  // Does direction magnitude matter? [0,0,10] vs [0,0,1] with same limit2
  const r5 = await makeRegion(200, 30, 30)
  const e5 = await api.v1.part.extrusion({
    id: partId, name: 'DirMag', references: [r5],
    type: 'CUSTOM', direction: [0, 0, 10], limit1: 0, limit2: 50
  })
  console.log('[08] dir [0,0,10]:', e5.result, 'maxLevel:', e5.maxLevel)

  filewrite({
    dirZ: { result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages },
    dirDiag: { result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages },
    dirX: { result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages },
    dirNZ: { result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages },
    dirMag: { result: e5.result, maxLevel: e5.maxLevel, messages: e5.messages },
  }, 'direction-results')

  await snapshot('custom-directions')
  return { partId }
}
