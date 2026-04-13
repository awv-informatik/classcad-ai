// Draw the bracket plate profile — individual lines to debug batch issue
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[02] partId:', partId, 'skId:', skId)

  // Profile vertices (clockwise from top-left):
  // (0,75) → (60,75) → (60,0) → (0,0) → (0,25) → (20,25) → (20,55) → (0,55) → (0,75)
  const verts = [
    [0, 75, 0], [60, 75, 0], [60, 0, 0], [0, 0, 0],
    [0, 25, 0], [20, 25, 0], [20, 55, 0], [0, 55, 0],
  ]

  const lineIds = []
  for (let i = 0; i < verts.length; i++) {
    const start = verts[i]
    const end = verts[(i + 1) % verts.length]
    const r = await api.v1.sketch.line({ id: skId, startPos: start, endPos: end })
    console.log(`[02] L${i}: ${r.result} maxLevel:${r.maxLevel}`)
    if (r.maxLevel > 31) console.log(`[02] L${i} messages:`, JSON.stringify(r.messages))
    lineIds.push(r.result)
  }

  // R10 fillets at notch inner corners
  // Corner (20,25): L4 meets L5
  const f1 = await api.v1.sketch.fillet({
    id: skId,
    lineIds: [lineIds[4], lineIds[5]],
    radius: 10,
  })
  console.log('[02] fillet1:', f1.result, 'maxLevel:', f1.maxLevel)
  if (f1.maxLevel > 31) console.log('[02] f1 msg:', JSON.stringify(f1.messages))

  // Corner (20,55): L5 meets L6
  const f2 = await api.v1.sketch.fillet({
    id: skId,
    lineIds: [lineIds[5], lineIds[6]],
    radius: 10,
  })
  console.log('[02] fillet2:', f2.result, 'maxLevel:', f2.maxLevel)
  if (f2.maxLevel > 31) console.log('[02] f2 msg:', JSON.stringify(f2.messages))

  // Two holes
  const c1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 55, 0], radius: 5 })
  console.log('[02] upper hole:', c1.result, 'maxLevel:', c1.maxLevel)

  const c2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 10, 0], radius: 5 })
  console.log('[02] lower hole:', c2.result, 'maxLevel:', c2.maxLevel)

  await snapshot('bracket')

  filewrite({ lineIds, fillet1: f1.result, fillet2: f2.result, hole1: c1.result, hole2: c2.result }, 'ids')

  return { partId, skId }
}
