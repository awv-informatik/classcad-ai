// Q6 SHOWCASE: can the solver lay out the mixer waist fillet WITHOUT precomputed tangent math?
// Two Ø45 circles fixed at (41,40),(79,40); rough R8 circle near the top waist;
// RADIUS 10 + TANGENT to both → expected center (60, 40+sqrt(32.5^2-19^2)) = (60, 66.367594).
export default async function (api, { filewrite, snapshot }) {
  const partId = (await api.v1.part.create({ name: 'FilletSolve' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result

  const mk = async (cx, cy, r) => {
    const id = (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r })).result
    return { id, center: (await api.v1.sketch.getPoints({ id })).result.centerId }
  }
  const c1 = await mk(41, 40, 20)   // deliberately wrong radius, will be dimensioned
  const c2 = await mk(79, 40, 20)
  await api.v1.sketch.constraint([
    { id: skId, type: 'FIXATION', geomIds: [c1.center] },
    { id: skId, type: 'FIXATION', geomIds: [c2.center] },
  ])
  const d1 = await api.v1.sketch.dimension([
    { id: skId, type: 'DIAMETER', geomIds: [c1.id], value: 45 },
    { id: skId, type: 'DIAMETER', geomIds: [c2.id], value: 45 },
  ])
  console.log('[07] boss dims maxLevel:', d1.maxLevel)

  // rough fillet circle near top waist — solver must find position AND the dimension its radius
  const cf = await mk(58, 60, 8)
  const dr = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [cf.id], value: 10 })
  const t1 = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [cf.id, c1.id] })
  const t2 = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [cf.id, c2.id] })
  console.log('[07] RADIUS maxLevel:', dr.maxLevel, 'TANGENT maxLevels:', t1.maxLevel, t2.maxLevel)

  const pos = (await api.v1.sketch.getPositions({ id: cf.center })).result.pos
  const exp = [60, 40 + Math.sqrt(32.5 ** 2 - 19 ** 2)]
  const d1c = Math.hypot(pos.x - 41, pos.y - 40), d2c = Math.hypot(pos.x - 79, pos.y - 40)
  console.log('[07] fillet center:', JSON.stringify(pos), `expected (${exp[0]}, ${exp[1].toFixed(6)})`)
  console.log('[07] dist to c1:', d1c.toFixed(6), 'to c2:', d2c.toFixed(6), '(external tangency ⇒ 32.5 both)')

  filewrite({ pos, exp, d1c, d2c }, 'filletsolve')
  await snapshot('07-fillet-solved')
  return { pos }
}
