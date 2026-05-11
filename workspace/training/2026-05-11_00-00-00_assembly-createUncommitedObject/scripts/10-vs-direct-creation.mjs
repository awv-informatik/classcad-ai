export default async function (api, { snapshot, filewrite }) {
  // Compare: createUncommitedObject + update vs direct creation (e.g. assembly.fastened)
  const asmId = (await api.v1.assembly.create({})).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl', height: 30, diameter: 15 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Inst2', transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Inst3', transformation: [[160, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // Method 1: Direct creation
  const directId = (await api.v1.assembly.fastened({
    id: asmId,
    name: 'DirectFastened',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[10] direct fastened id:', directId)

  // Method 2: Two-phase creation
  const twoPhaseId = (await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_FastenedConstraint',
    name: 'TwoPhaseFastened',
  })).result
  console.log('[10] two-phase uncommitted id:', twoPhaseId)

  await api.v1.part.openFeature({ id: twoPhaseId })
  await api.v1.assembly.updateFastened({
    id: twoPhaseId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs2 },
    xOffset: 20,
  })
  await api.v1.part.closeFeature({ id: twoPhaseId })

  // Compare results
  const getDirect = (await api.v1.assembly.getFastened({ id: asmId, name: 'DirectFastened' })).result
  const getTwoPhase = (await api.v1.assembly.getFastened({ id: asmId, name: 'TwoPhaseFastened' })).result
  console.log('[10] direct result:', JSON.stringify(getDirect, null, 2))
  console.log('[10] twoPhase result:', JSON.stringify(getTwoPhase, null, 2))

  filewrite({ direct: getDirect, twoPhase: getTwoPhase }, 'comparison')

  await snapshot('both-methods')
  return { directId, twoPhaseId }
}
