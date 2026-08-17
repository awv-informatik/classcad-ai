// Verify TANGENT circle-circle using getPoints/getPositions
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'TangentCCv' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Circle 1 fixed at (0, 0), radius 20
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 20 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [c1] })

  // Circle 2 at (60, 0), radius 15
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [60, 0, 0], radius: 15 })).result

  // Get center IDs
  const c1pts = (await api.v1.sketch.getPoints({ id: c1 })).result
  const c2pts = (await api.v1.sketch.getPoints({ id: c2 })).result

  const c1before = (await api.v1.sketch.getPositions({ id: c1pts.centerId })).result.pos
  const c2before = (await api.v1.sketch.getPositions({ id: c2pts.centerId })).result.pos
  console.log('[04c] c1 before:', JSON.stringify(c1before))
  console.log('[04c] c2 before:', JSON.stringify(c2before))

  await snapshot('before')

  // TANGENT circle-circle
  const r = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [c1, c2] })
  console.log('[04c] TANGENT result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) r.messages.forEach(m => console.log('[04c] msg:', m.message, 'level:', m.level))

  const c1after = (await api.v1.sketch.getPositions({ id: c1pts.centerId })).result.pos
  const c2after = (await api.v1.sketch.getPositions({ id: c2pts.centerId })).result.pos
  console.log('[04c] c1 after:', JSON.stringify(c1after))
  console.log('[04c] c2 after:', JSON.stringify(c2after))

  const dist = Math.sqrt((c2after.x - c1after.x) ** 2 + (c2after.y - c1after.y) ** 2)
  console.log('[04c] center dist:', dist, 'r1+r2:', 35, 'external:', Math.abs(dist - 35) < 0.1)

  await snapshot('after')

  filewrite({
    c1before, c2before, c1after, c2after,
    centerDist: dist,
    externalTangent: Math.abs(dist - 35) < 0.1,
    internalTangent: Math.abs(dist - 5) < 0.1,
    constraintResult: r.result,
    maxLevel: r.maxLevel
  }, 'tangent-cc-verify')

  return { partId }
}
