// Q8+Q9: (a) conflicting constraints with ACTIVE solver — silent or error? geometry state?
// (b) updateDimension re-solve: Ø45→Ø60 on the fillet system → whole layout adapts?
// expected new fillet center y = 40 + sqrt((30+10)^2 - 19^2) = 40 + 35.199432 = 75.199432
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Conf' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // (a) conflicts
  const skA = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'A' })).result
  const l1 = (await api.v1.sketch.line({ id: skA, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
  const h = await api.v1.sketch.constraint({ id: skA, type: 'HORIZONTAL', geomIds: [l1] })
  const v = await api.v1.sketch.constraint({ id: skA, type: 'VERTICAL', geomIds: [l1] })
  const l1after = (await api.v1.sketch.getPositions({ id: l1 })).result
  console.log('[09] H then V on same line: H maxLevel', h.maxLevel, '/ V maxLevel', v.maxLevel, '— line:', JSON.stringify(l1after))
  const vNode = Object.values(v.structure?.tree ?? {}).find(n => n?.id === v.result)
  console.log('[09] V constraint node lgsState:', JSON.stringify(vNode?.members?.lgsState ?? null))

  // (b) re-solve adaptivity
  const skB = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'B' })).result
  const mk = async (cx, cy, r) => {
    const id = (await api.v1.sketch.circle({ id: skB, centerPos: [cx, cy, 0], radius: r })).result
    return { id, center: (await api.v1.sketch.getPoints({ id })).result.centerId }
  }
  const c1 = await mk(41, 40, 20), c2 = await mk(79, 40, 20)
  await api.v1.sketch.constraint([
    { id: skB, type: 'FIXATION', geomIds: [c1.center] },
    { id: skB, type: 'FIXATION', geomIds: [c2.center] },
  ])
  const dims = (await api.v1.sketch.dimension([
    { id: skB, type: 'DIAMETER', geomIds: [c1.id], value: 45 },
    { id: skB, type: 'DIAMETER', geomIds: [c2.id], value: 45 },
  ])).result
  const cf = await mk(58, 60, 8)
  await api.v1.sketch.dimension({ id: skB, type: 'RADIUS', geomIds: [cf.id], value: 10 })
  await api.v1.sketch.constraint([
    { id: skB, type: 'TANGENT', geomIds: [cf.id, c1.id] },
    { id: skB, type: 'TANGENT', geomIds: [cf.id, c2.id] },
  ])
  const before = (await api.v1.sketch.getPositions({ id: cf.center })).result.pos
  console.log('[09] fillet center @ Ø45:', JSON.stringify(before), '(expect y≈66.367594)')

  const u1 = await api.v1.sketch.updateDimension({ id: dims[0], value: 60 })
  const u2 = await api.v1.sketch.updateDimension({ id: dims[1], value: 60 })
  const after = (await api.v1.sketch.getPositions({ id: cf.center })).result.pos
  const expY = 40 + Math.sqrt(40 ** 2 - 19 ** 2)
  console.log('[09] updateDimension results:', u1.result, u2.result, '(1 = solved)')
  console.log('[09] fillet center @ Ø60:', JSON.stringify(after), `expected (60, ${expY.toFixed(6)}) — system re-laid-out:`, Math.abs(after.y - expY) < 1e-6)

  filewrite({ l1after, before, after, expY }, 'resolve')
  return {}
}
