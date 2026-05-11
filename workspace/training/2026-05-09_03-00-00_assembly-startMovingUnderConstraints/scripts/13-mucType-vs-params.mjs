export default async function (api, { snapshot, filewrite }) {
  // Test: does mucType actually constrain which params work, or is it purely for the solver?
  // Compare ROTATION mode + offset vs TRANSLATION_2D mode + rotation
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Wcs', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Block1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Test A: TRANSLATION_2D mode + rotation param (should rotation still work?)
  console.log('[13] --- Test A: TRANSLATION_2D + rotation ---')
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_2D',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  const massTransRot = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[13] COG TRANSLATION_2D+rotation:', JSON.stringify(massTransRot?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Reset
  await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })

  // Test B: TRANSLATION_1D mode + rotation param
  console.log('[13] --- Test B: TRANSLATION_1D + rotation ---')
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_1D',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  const massTrans1dRot = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[13] COG TRANSLATION_1D+rotation:', JSON.stringify(massTrans1dRot?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Reset
  await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })

  // Test C: ROTATION mode + offset only (no rotation param)
  console.log('[13] --- Test C: ROTATION + offset only ---')
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [50, 30, 0],
  })
  const massRotOffset = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[13] COG ROTATION+offset-only:', JSON.stringify(massRotOffset?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Reference: COG at origin
  console.log('[13] Reference COG at origin: {"x":20,"y":15,"z":10}')

  filewrite({ massTransRot, massTrans1dRot, massRotOffset }, 'mucType-comparison')

  return { asmId }
}
