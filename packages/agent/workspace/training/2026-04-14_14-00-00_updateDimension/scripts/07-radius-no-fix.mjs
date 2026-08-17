// Test updateDimension on RADIUS/DIAMETER without FIXATION on circle
// Script 04 fixed the circles, which prevented radius changes (result=0)
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'RadiusNoFix' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Circle 1: for RADIUS test — no FIXATION at all
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 50, 0], radius: 20 })).result
  console.log('[07] c1:', c1)

  // Circle 2: for DIAMETER test — no FIXATION
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [150, 50, 0], radius: 15 })).result
  console.log('[07] c2:', c2)

  // Helper: get circle radius from structure tree
  const getRadius = (structure, circleId) => {
    const node = structure.tree[circleId]
    return node?.members?.radius?.value
  }

  // RADIUS dimension on c1
  const rdR = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [c1] })
  const rd = rdR.result
  console.log('[07] RADIUS dim created:', rd, 'maxLevel:', rdR.maxLevel)

  const r1Before = getRadius(rdR.structure, c1)
  console.log('[07] c1 radius before update:', r1Before)

  // Update RADIUS to 40
  const ur = await api.v1.sketch.updateDimension({ id: rd, value: 40 })
  console.log('[07] RADIUS update: result:', ur.result, 'maxLevel:', ur.maxLevel)

  const r1After = getRadius(ur.structure, c1)
  console.log('[07] c1 radius after update:', r1After)

  // DIAMETER dimension on c2
  const ddR = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [c2] })
  const dd = ddR.result
  console.log('[07] DIAMETER dim created:', dd, 'maxLevel:', ddR.maxLevel)

  const r2Before = getRadius(ddR.structure, c2)
  console.log('[07] c2 radius before update:', r2Before)

  // Update DIAMETER to 60 (radius should become 30)
  const ud = await api.v1.sketch.updateDimension({ id: dd, value: 60 })
  console.log('[07] DIAMETER update: result:', ud.result, 'maxLevel:', ud.maxLevel)

  const r2After = getRadius(ud.structure, c2)
  console.log('[07] c2 radius after update:', r2After)

  await snapshot('result')

  filewrite({
    radius: {
      dimId: rd,
      updateResult: ur.result,
      updateMaxLevel: ur.maxLevel,
      radiusBefore: r1Before,
      radiusAfter: r1After,
      expected: 40,
    },
    diameter: {
      dimId: dd,
      updateResult: ud.result,
      updateMaxLevel: ud.maxLevel,
      radiusBefore: r2Before,
      radiusAfter: r2After,
      expectedRadius: 30,
    },
  }, 'radius-no-fix-data')

  return { partId }
}
