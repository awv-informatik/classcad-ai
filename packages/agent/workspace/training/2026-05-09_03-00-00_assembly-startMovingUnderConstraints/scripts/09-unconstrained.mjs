export default async function (api, { snapshot, filewrite }) {
  // Test: motion on an unconstrained (free) instance
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Wcs', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'FreeBlock',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[09] inst:', inst)

  // No constraints at all — the instance is completely free
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG before:', JSON.stringify(massBefore?.cog))

  // Test A: ROTATION on free instance
  const startR = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  console.log('[09] start ROTATION:', startR.result, 'maxLevel:', startR.maxLevel)
  filewrite({ result: startR.result, messages: startR.messages, maxLevel: startR.maxLevel }, 'start-rotation-free')

  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  const massRotated = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG after rotation:', JSON.stringify(massRotated?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('rotated-free')

  // Test B: TRANSLATION_2D on free instance
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_2D',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [50, 30, 0],
  })
  const massTrans = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG after translation:', JSON.stringify(massTrans?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('translated-free')

  filewrite({ massBefore, massRotated, massTrans }, 'free-motion-comparison')

  return { asmId }
}
