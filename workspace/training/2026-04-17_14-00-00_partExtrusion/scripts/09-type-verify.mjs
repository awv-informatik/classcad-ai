export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypeVerify' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeRegion(x) {
    const sk = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const lines = (await api.v1.sketch.rectangle({ id: sk, startPos: [x, 0, 0], endPos: [x + 30, 30, 0] })).result
    return (await api.v1.sketch.sketchRegion({ id: sk, geomIds: lines })).result
  }

  // Create extrusions with different types, all with limit2=40
  const types = ['UP', 'DOWN', 'SYMMETRIC']
  const results = {}

  for (let i = 0; i < types.length; i++) {
    const r = await makeRegion(i * 50)
    const e = await api.v1.part.extrusion({
      id: partId, name: `Ext${types[i]}`, references: [r],
      type: types[i], limit2: 40
    })

    // Get bounding box info from graphic data
    const recalc = await api.v1.common.recalc({})

    results[types[i]] = {
      featureId: e.result,
      maxLevel: e.maxLevel,
    }
    console.log(`[09] ${types[i]}: id=${e.result} maxLevel=${e.maxLevel}`)
  }

  // CUSTOM with limit1=-10, limit2=30
  const r4 = await makeRegion(150)
  const e4 = await api.v1.part.extrusion({
    id: partId, name: 'ExtCUSTOM', references: [r4],
    type: 'CUSTOM', limit1: -10, limit2: 30, direction: [0, 0, 1]
  })
  results['CUSTOM'] = { featureId: e4.result, maxLevel: e4.maxLevel }
  console.log(`[09] CUSTOM: id=${e4.result} maxLevel=${e4.maxLevel}`)

  // Use getExpression on each feature to read back actual limit values
  for (const type of [...types, 'CUSTOM']) {
    const fid = results[type].featureId
    if (!fid) continue

    // Try reading feature parameters via getExpression
    try {
      const limit2Val = await api.v1.part.getExpression({ id: fid, name: 'limit2' })
      results[type].limit2 = limit2Val.result
      console.log(`[09] ${type} limit2:`, limit2Val.result)
    } catch (e) {
      console.log(`[09] ${type} limit2 getExpression failed`)
    }

    try {
      const limit1Val = await api.v1.part.getExpression({ id: fid, name: 'limit1' })
      results[type].limit1 = limit1Val.result
      console.log(`[09] ${type} limit1:`, limit1Val.result)
    } catch (e) {
      console.log(`[09] ${type} limit1 getExpression failed`)
    }
  }

  filewrite(results, 'type-verify')
  await snapshot('type-verify')
  return { partId }
}
