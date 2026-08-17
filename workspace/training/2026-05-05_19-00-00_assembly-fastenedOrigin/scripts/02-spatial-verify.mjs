export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance A at origin (no constraint yet, just placed at [0,0,0])
  const instA = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
  })).result

  // Instance B at offset [80, 50, 30]
  const instB = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[80, 50, 30], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[02] instA:', instA, 'instB:', instB)
  await snapshot('before-fo')

  // Get assembly-level mass properties before constraint
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] mass before COG:', JSON.stringify(massBefore?.centerOfGravity))
  filewrite(massBefore, 'mass-before')

  // Apply fastenedOrigin to instB — should move it to assembly origin
  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_B',
    mate1: { path: [instB], csys: wcs },
  })
  console.log('[02] fastenedOrigin result:', foR.result, 'maxLevel:', foR.maxLevel)

  await snapshot('after-fo')

  // Get assembly-level mass properties after constraint
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] mass after COG:', JSON.stringify(massAfter?.centerOfGravity))
  filewrite(massAfter, 'mass-after')

  // Also get getInstance to check instB's transform
  const instBState = (await api.v1.assembly.getInstance({ id: instB })).result
  console.log('[02] instB transform after:', JSON.stringify(instBState?.transformation))
  filewrite(instBState, 'instB-state-after')

  // Get getInstance for instA to confirm it didn't move
  const instAState = (await api.v1.assembly.getInstance({ id: instA })).result
  console.log('[02] instA transform:', JSON.stringify(instAState?.transformation))
  filewrite(instAState, 'instA-state-after')

  return { asmId, instA, instB, foId: foR.result }
}
