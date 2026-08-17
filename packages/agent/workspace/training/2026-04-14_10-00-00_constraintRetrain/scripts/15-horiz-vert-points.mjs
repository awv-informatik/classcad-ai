// Test: HORIZONTAL and VERTICAL on point pairs (not lines)
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'HVPointsTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Two points, not aligned
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [10, 20, 0] })).result
  const pt2 = (await api.v1.sketch.point({ id: skId, pos: [50, 35, 0] })).result
  // Fix pt1
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pt1] })

  const posBefore = {
    pt1: (await api.v1.sketch.getPositions({ id: pt1 })).result,
    pt2: (await api.v1.sketch.getPositions({ id: pt2 })).result,
  }
  console.log('[15] before pt2:', JSON.stringify(posBefore.pt2))

  // HORIZONTAL on 2 points — pt2 should move to same Y as pt1
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [pt1, pt2] })
  console.log('[15] horiz result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfterH = {
    pt1: (await api.v1.sketch.getPositions({ id: pt1 })).result,
    pt2: (await api.v1.sketch.getPositions({ id: pt2 })).result,
  }
  const sameY = Math.abs(posAfterH.pt1.pos.y - posAfterH.pt2.pos.y) < 0.01
  console.log('[15] after HORIZONTAL pt2:', JSON.stringify(posAfterH.pt2), 'sameY:', sameY)

  await snapshot('result')

  filewrite({
    before: posBefore,
    afterHoriz: posAfterH,
    sameY,
    constraintResult: cr.result,
    maxLevel: cr.maxLevel,
  }, 'horiz-vert-points-data')

  return { partId }
}
