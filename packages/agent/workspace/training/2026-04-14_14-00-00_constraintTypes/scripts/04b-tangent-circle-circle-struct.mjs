// Test TANGENT circle-circle — use structure tree for center verification
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'TangentCC' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Circle 1 fixed at (0, 0), radius 20
  const c1R = await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 20 })
  const c1 = c1R.result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [c1] })

  // Circle 2 at (60, 0), radius 15
  const c2R = await api.v1.sketch.circle({ id: skId, centerPos: [60, 0, 0], radius: 15 })
  const c2 = c2R.result
  console.log('[04b] c1:', c1, 'c2:', c2)

  await snapshot('before')

  // TANGENT circle-circle
  const r = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [c1, c2] })
  console.log('[04b] TANGENT result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) r.messages.forEach(m => console.log('[04b] msg:', m.message, 'level:', m.level))

  // Read centers from structure tree after
  const c1node = Object.values(r.structure.tree).find(n => n.id === c1)
  const c2node = Object.values(r.structure.tree).find(n => n.id === c2)
  const c1center = c1node?.members?.center?.value
  const c2center = c2node?.members?.center?.value
  const r1 = c1node?.members?.radius?.value
  const r2 = c2node?.members?.radius?.value

  console.log('[04b] c1 center:', JSON.stringify(c1center), 'r1:', r1)
  console.log('[04b] c2 center:', JSON.stringify(c2center), 'r2:', r2)

  if (c1center && c2center) {
    const dist = Math.sqrt((c2center.x - c1center.x) ** 2 + (c2center.y - c1center.y) ** 2)
    const external = Math.abs(dist - (r1 + r2)) < 0.1
    const internal = Math.abs(dist - Math.abs(r1 - r2)) < 0.1
    console.log('[04b] center dist:', dist, 'r1+r2:', r1 + r2, 'external:', external, 'internal:', internal)

    filewrite({
      constraintResult: r.result,
      maxLevel: r.maxLevel,
      c1center, c2center, r1, r2,
      centerDist: dist,
      externalTangent: external,
      internalTangent: internal
    }, 'tangent-circle-circle')
  } else {
    filewrite({ constraintResult: r.result, maxLevel: r.maxLevel, error: 'Could not read circle centers' }, 'tangent-circle-circle')
  }

  await snapshot('after')

  return { partId }
}
