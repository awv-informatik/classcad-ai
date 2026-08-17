export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypeTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Helper: create sketch with rectangle at offset, return region ID
  async function makeRegion(xOffset, w, h) {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const lines = (await api.v1.sketch.rectangle({ id: skId, startPos: [xOffset, 0, 0], endPos: [xOffset + w, h, 0] })).result
    return (await api.v1.sketch.sketchRegion({ id: skId, geomIds: lines })).result
  }

  // Create 4 regions side by side
  const r1 = await makeRegion(0, 30, 30)
  const r2 = await makeRegion(50, 30, 30)
  const r3 = await makeRegion(100, 30, 30)
  const r4 = await makeRegion(150, 30, 30)
  console.log('[03] regions:', r1, r2, r3, r4)

  // UP extrusion — limit2=40
  const e1 = await api.v1.part.extrusion({ id: partId, name: 'ExtUp', references: [r1], type: 'UP', limit2: 40 })
  console.log('[03] UP:', e1.result, 'maxLevel:', e1.maxLevel)

  // DOWN extrusion — limit2=40
  const e2 = await api.v1.part.extrusion({ id: partId, name: 'ExtDown', references: [r2], type: 'DOWN', limit2: 40 })
  console.log('[03] DOWN:', e2.result, 'maxLevel:', e2.maxLevel)

  // SYMMETRIC extrusion — limit2=40 (total or per-side?)
  const e3 = await api.v1.part.extrusion({ id: partId, name: 'ExtSym', references: [r3], type: 'SYMMETRIC', limit2: 40 })
  console.log('[03] SYMMETRIC:', e3.result, 'maxLevel:', e3.maxLevel)

  // CUSTOM extrusion — limit1=-10, limit2=30, direction=[0,0,1]
  const e4 = await api.v1.part.extrusion({
    id: partId, name: 'ExtCustom', references: [r4], type: 'CUSTOM',
    limit1: -10, limit2: 30, direction: [0, 0, 1]
  })
  console.log('[03] CUSTOM:', e4.result, 'maxLevel:', e4.maxLevel)

  filewrite({
    UP: { result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages },
    DOWN: { result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages },
    SYMMETRIC: { result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages },
    CUSTOM: { result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages },
  }, 'type-results')

  await snapshot('all-types')
  return { partId }
}
