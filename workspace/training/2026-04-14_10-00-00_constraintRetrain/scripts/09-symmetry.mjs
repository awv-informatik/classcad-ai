// Test: SYMMETRY — do points/lines become symmetric about axis?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'SymTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Vertical axis line (fixed)
  const axis = (await api.v1.sketch.line({ id: skId, startPos: [40, -20, 0], endPos: [40, 60, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [axis] })

  // Two points — NOT symmetric about x=40
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [10, 20, 0] })).result
  const pt2 = (await api.v1.sketch.point({ id: skId, pos: [60, 25, 0] })).result
  // Fix pt1 so pt2 moves
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pt1] })

  const posBefore = {
    pt1: (await api.v1.sketch.getPositions({ id: pt1 })).result,
    pt2: (await api.v1.sketch.getPositions({ id: pt2 })).result,
  }
  console.log('[09] before pt1:', JSON.stringify(posBefore.pt1))
  console.log('[09] before pt2:', JSON.stringify(posBefore.pt2))

  await snapshot('before')

  // SYMMETRY: axis first, then the two elements
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'SYMMETRY', geomIds: [axis, pt1, pt2] })
  console.log('[09] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)
  if (cr.messages?.length) console.log('[09] messages:', JSON.stringify(cr.messages))

  const posAfter = {
    pt1: (await api.v1.sketch.getPositions({ id: pt1 })).result,
    pt2: (await api.v1.sketch.getPositions({ id: pt2 })).result,
  }
  console.log('[09] after pt1:', JSON.stringify(posAfter.pt1))
  console.log('[09] after pt2:', JSON.stringify(posAfter.pt2))

  await snapshot('after')

  // pt2 should mirror pt1 about x=40: expected pt2.x = 40 + (40 - pt1.x) = 70
  const expectedX = 40 + (40 - posAfter.pt1.pos.x)
  const isSymmetric = Math.abs(posAfter.pt2.pos.x - expectedX) < 0.01 && Math.abs(posAfter.pt2.pos.y - posAfter.pt1.pos.y) < 0.01
  console.log('[09] isSymmetric:', isSymmetric, 'expectedX:', expectedX, 'actualX:', posAfter.pt2.pos.x)

  filewrite({ before: posBefore, after: posAfter, constraintResult: cr.result, maxLevel: cr.maxLevel, isSymmetric }, 'symmetry-data')

  return { partId }
}
