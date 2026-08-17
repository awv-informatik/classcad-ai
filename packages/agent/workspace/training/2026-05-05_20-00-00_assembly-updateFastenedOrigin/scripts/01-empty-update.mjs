export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with a template containing a box + wcs
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instance with known offset
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
    transformation: [[50, 30, 10], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create fastenedOrigin with specific offsets
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst], csys: wcs },
    xOffset: 50, yOffset: 30, zOffset: 10,
  })).result
  console.log('[01] foId:', foId)

  // Measure COG before empty update
  const cogBefore = (await api.v1.part.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG before empty update:', JSON.stringify(cogBefore?.centerOfGravity))

  // Empty update — just { id }
  const emptyR = await api.v1.assembly.updateFastenedOrigin({ id: foId })
  console.log('[01] empty update result:', emptyR.result, 'maxLevel:', emptyR.maxLevel)

  // Measure COG after empty update
  const cogAfter = (await api.v1.part.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG after empty update:', JSON.stringify(cogAfter?.centerOfGravity))

  // Verify state unchanged via getFastenedOrigin
  const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[01] state after empty update:', JSON.stringify(state))

  filewrite({
    cogBefore: cogBefore?.centerOfGravity,
    cogAfter: cogAfter?.centerOfGravity,
    emptyUpdateResult: emptyR.result,
    emptyUpdateMaxLevel: emptyR.maxLevel,
    stateAfter: state,
  }, 'empty-update')

  await snapshot('empty-update')
  return { foId }
}
