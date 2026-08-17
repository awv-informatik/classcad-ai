export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'CsysA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'CsysB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create revolute with NON-DEFAULT values for everything
  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'FullHinge',
    mate1: { path: [inst1], csys: wcsA, flip: 'X', reorient: '90' },
    mate2: { path: [inst2], csys: wcsB, flip: '-Z', reorient: '180' },
    zOffset: 15,
    zRotationLimits: { min: '-30deg', max: '60deg' },
  })).result

  // Snapshot the initial state
  const initial = (await api.v1.assembly.getRevolute({ id: asmId, name: 'FullHinge' })).result
  console.log('[04] initial:', JSON.stringify({
    name: initial.name,
    m1flip: initial.mate1.flip, m1reorient: initial.mate1.reorient,
    m2flip: initial.mate2.flip, m2reorient: initial.mate2.reorient,
    zOffset: initial.zOffset, limits: initial.zRotationLimits,
  }))

  // Update ONLY name — everything else should be preserved
  await api.v1.assembly.updateRevolute({ id: revId, name: 'RenamedHinge' })
  const afterName = (await api.v1.assembly.getRevolute({ id: asmId, name: 'RenamedHinge' })).result

  const checks = {
    nameChanged: afterName.name === 'RenamedHinge',
    m1flipPreserved: afterName.mate1.flip === initial.mate1.flip,
    m1reorientPreserved: afterName.mate1.reorient === initial.mate1.reorient,
    m2flipPreserved: afterName.mate2.flip === initial.mate2.flip,
    m2reorientPreserved: afterName.mate2.reorient === initial.mate2.reorient,
    zOffsetPreserved: afterName.zOffset === initial.zOffset,
    limitsMinPreserved: afterName.zRotationLimits.min === initial.zRotationLimits.min,
    limitsMaxPreserved: afterName.zRotationLimits.max === initial.zRotationLimits.max,
    m1pathPreserved: JSON.stringify(afterName.mate1.path) === JSON.stringify(initial.mate1.path),
    m1csysPreserved: afterName.mate1.csys === initial.mate1.csys,
    m2pathPreserved: JSON.stringify(afterName.mate2.path) === JSON.stringify(initial.mate2.path),
    m2csysPreserved: afterName.mate2.csys === initial.mate2.csys,
  }

  const allPreserved = Object.values(checks).every(v => v)
  console.log('[04] all fields preserved after name-only update:', allPreserved)
  if (!allPreserved) {
    for (const [k, v] of Object.entries(checks)) {
      if (!v) console.log('[04]  FAILED:', k)
    }
  }

  // Update ONLY mate2.flip — everything else including mate2.reorient should be preserved
  await api.v1.assembly.updateRevolute({ id: revId, mate2: { flip: 'Y' } })
  const afterFlip = (await api.v1.assembly.getRevolute({ id: asmId, name: 'RenamedHinge' })).result

  const checks2 = {
    m2flipChanged: afterFlip.mate2.flip === 'Y',
    m2reorientPreserved: afterFlip.mate2.reorient === '180',
    m1flipPreserved: afterFlip.mate1.flip === 'X',
    m1reorientPreserved: afterFlip.mate1.reorient === '90',
    zOffsetPreserved: afterFlip.zOffset === 15,
    namePreserved: afterFlip.name === 'RenamedHinge',
  }

  const allPreserved2 = Object.values(checks2).every(v => v)
  console.log('[04] all fields preserved after flip-only update:', allPreserved2)
  if (!allPreserved2) {
    for (const [k, v] of Object.entries(checks2)) {
      if (!v) console.log('[04]  FAILED:', k, 'got:', afterFlip.mate2?.[k])
    }
  }

  filewrite({ initial, afterName, afterFlip, checks, checks2 }, 'preservation-data')
  return { revId }
}
