// Test TANGENT between two circles
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'TangentCC' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Circle 1 fixed at (0, 0), radius 20
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 20 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [c1] })

  // Circle 2 at (60, 0), radius 15 — not touching
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [60, 0, 0], radius: 15 })).result
  console.log('[04] c1:', c1, 'c2:', c2)

  await snapshot('before')

  // TANGENT circle-circle
  const r = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [c1, c2] })
  console.log('[04] TANGENT circle-circle result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) r.messages.forEach(m => console.log('[04] msg:', m.message, 'level:', m.level))

  // Read positions after
  const c1pos = (await api.v1.sketch.getPositions({ id: c1 })).result
  const c2pos = (await api.v1.sketch.getPositions({ id: c2 })).result
  console.log('[04] c1 center:', JSON.stringify(c1pos))
  console.log('[04] c2 center:', JSON.stringify(c2pos))

  await snapshot('after')

  // Distance between centers should = r1 + r2 (external tangent) or |r1 - r2| (internal)
  const p1 = c1pos.pos ? [c1pos.pos.x, c1pos.pos.y] : [0, 0]
  const p2 = c2pos.pos ? [c2pos.pos.x, c2pos.pos.y] : [60, 0]
  const dist = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)
  console.log('[04] center distance:', dist, 'r1+r2:', 35, 'external tangent:', Math.abs(dist - 35) < 0.1)

  filewrite({
    constraintResult: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    c1center: p1,
    c2center: p2,
    centerDist: dist,
    externalTangent: Math.abs(dist - 35) < 0.1,
    internalTangent: Math.abs(dist - 5) < 0.1
  }, 'tangent-circle-circle')

  return { partId }
}
