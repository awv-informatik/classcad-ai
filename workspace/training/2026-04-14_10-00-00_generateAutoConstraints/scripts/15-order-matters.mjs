// Test: confirm that creation ORDER determines auto-constraint detection
// Case A: point first, line second — point-on-line NOT auto-detected
// Case B: line first, point second — point-on-line IS auto-detected
// Then test generateAutoConstraints as the remedy for Case A
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'OrderTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  // Case A: point first, line second
  const skA = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const ptA = (await api.v1.sketch.point({ id: skA, pos: [25, 0, 0] })).result
  const lA = (await api.v1.sketch.line({ id: skA, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result

  const consA = Object.values((await api.v1.sketch.getGeometry({ id: skA })).structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  const hasCoincA = consA.some(c => c.class.includes('Coincident'))
  console.log('[15] Case A (pt first, line second): constraints=', consA.length, 'hasCoincidence=', hasCoincA)
  filewrite(consA.map(c => ({ id: c.id, class: c.class, name: c.name })), 'case-a-constraints')

  // Now call autoGen on the point → should detect point-on-line
  const rA = await api.v1.sketch.generateAutoConstraints({ id: skA, geomId: ptA })
  const consAAfter = Object.values(rA.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  const hasCoincAAfter = consAAfter.some(c => c.class.includes('Coincident'))
  console.log('[15] Case A after autoGen: constraints=', consAAfter.length, 'hasCoincidence=', hasCoincAAfter)
  filewrite(consAAfter.map(c => ({ id: c.id, class: c.class, name: c.name })), 'case-a-after-autogen')

  // Case B: line first, point second
  const skB = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const lB = (await api.v1.sketch.line({ id: skB, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const ptB = (await api.v1.sketch.point({ id: skB, pos: [25, 0, 0] })).result

  const consB = Object.values((await api.v1.sketch.getGeometry({ id: skB })).structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  const hasCoincB = consB.some(c => c.class.includes('Coincident'))
  console.log('[15] Case B (line first, pt second): constraints=', consB.length, 'hasCoincidence=', hasCoincB)
  filewrite(consB.map(c => ({ id: c.id, class: c.class, name: c.name })), 'case-b-constraints')

  // Case C: test genIncidence=false — should NOT add coincidence
  const skC = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const ptC = (await api.v1.sketch.point({ id: skC, pos: [25, 0, 0] })).result
  const lC = (await api.v1.sketch.line({ id: skC, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result

  const consC = Object.values((await api.v1.sketch.getGeometry({ id: skC })).structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[15] Case C before autoGen:', consC.length)

  const rC = await api.v1.sketch.generateAutoConstraints({ id: skC, geomId: ptC, genIncidence: false })
  const consCAfter = Object.values(rC.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[15] Case C genIncidence=false:', consCAfter.length, '(should equal before)')

  const rC2 = await api.v1.sketch.generateAutoConstraints({ id: skC, geomId: ptC, genIncidence: true })
  const consCAfter2 = Object.values(rC2.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[15] Case C genIncidence=true:', consCAfter2.length, '(should be +1)')

  return { partId }
}
