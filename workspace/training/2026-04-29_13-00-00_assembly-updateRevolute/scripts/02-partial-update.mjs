export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PartialAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'A' })).result
  await api.v1.part.box({ id: tpl1, length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'W1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'B' })).result
  await api.v1.part.box({ id: tpl2, length: 30, width: 30, height: 40 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'W2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result

  // Create with specific values
  const cId = (await api.v1.assembly.revolute({
    id: asmId, name: 'PartialTest',
    mate1: { path: [inst1], csys: wcs1, flip: 'X', reorient: '90' },
    mate2: { path: [inst2], csys: wcs2, flip: '-Z', reorient: '180' },
    zOffset: 10,
    zRotationLimits: { min: '-30deg', max: '60deg' },
  })).result
  console.log('[02] created:', cId)

  const initial = (await api.v1.assembly.getRevolute({ id: asmId, name: 'PartialTest' })).result
  filewrite(initial, 'initial-state')
  console.log('[02] initial mate1 flip:', initial.mate1.flip, 'reorient:', initial.mate1.reorient)
  console.log('[02] initial mate2 flip:', initial.mate2.flip, 'reorient:', initial.mate2.reorient)
  console.log('[02] initial zOffset:', initial.zOffset, 'limits:', JSON.stringify(initial.zRotationLimits))

  // Update ONLY name — everything else should be preserved
  await api.v1.assembly.updateRevolute({ id: cId, name: 'JustName' })
  const afterNameOnly = (await api.v1.assembly.getRevolute({ id: asmId, name: 'JustName' })).result
  filewrite(afterNameOnly, 'after-name-only')

  console.log('[02] after name-only update:')
  console.log('[02]   name:', afterNameOnly.name)
  console.log('[02]   mate1 flip:', afterNameOnly.mate1.flip, 'reorient:', afterNameOnly.mate1.reorient)
  console.log('[02]   mate2 flip:', afterNameOnly.mate2.flip, 'reorient:', afterNameOnly.mate2.reorient)
  console.log('[02]   zOffset:', afterNameOnly.zOffset)
  console.log('[02]   limits:', JSON.stringify(afterNameOnly.zRotationLimits))

  // Verify each field preserved
  const preserved = {
    mate1Flip: afterNameOnly.mate1.flip === initial.mate1.flip,
    mate1Reorient: afterNameOnly.mate1.reorient === initial.mate1.reorient,
    mate2Flip: afterNameOnly.mate2.flip === initial.mate2.flip,
    mate2Reorient: afterNameOnly.mate2.reorient === initial.mate2.reorient,
    zOffset: afterNameOnly.zOffset === initial.zOffset,
    limitsMin: afterNameOnly.zRotationLimits.min === initial.zRotationLimits.min,
    limitsMax: afterNameOnly.zRotationLimits.max === initial.zRotationLimits.max,
    mate1Path: JSON.stringify(afterNameOnly.mate1.path) === JSON.stringify(initial.mate1.path),
    mate1Csys: afterNameOnly.mate1.csys === initial.mate1.csys,
    mate2Path: JSON.stringify(afterNameOnly.mate2.path) === JSON.stringify(initial.mate2.path),
    mate2Csys: afterNameOnly.mate2.csys === initial.mate2.csys,
  }
  console.log('[02] all preserved:', JSON.stringify(preserved))
  const allPreserved = Object.values(preserved).every(Boolean)
  console.log('[02] partial update safe:', allPreserved ? '✓' : '❌')

  // Update ONLY mate2 flip — verify everything else preserved
  await api.v1.assembly.updateRevolute({ id: cId, mate2: { flip: 'Y' } })
  const afterFlipOnly = (await api.v1.assembly.getRevolute({ id: asmId, name: 'JustName' })).result
  filewrite(afterFlipOnly, 'after-mate2-flip-only')

  console.log('[02] after mate2 flip-only:')
  console.log('[02]   mate2 flip changed:', afterFlipOnly.mate2.flip, '(expected Y)')
  console.log('[02]   mate2 reorient preserved:', afterFlipOnly.mate2.reorient === '180')
  console.log('[02]   mate1 flip preserved:', afterFlipOnly.mate1.flip === 'X')
  console.log('[02]   zOffset preserved:', afterFlipOnly.zOffset === 10)

  return { cId }
}
