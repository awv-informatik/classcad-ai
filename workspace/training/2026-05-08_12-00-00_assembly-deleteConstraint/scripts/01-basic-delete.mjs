export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground inst1
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcs },
  })).result

  // Fasten inst2 at xOffset=80
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'Joint',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 80,
  })).result

  console.log('[01] foId:', foId, 'fId:', fId)

  // Measure inst2 COG before deletion
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG before delete:', JSON.stringify(cogBefore?.centerOfGravity))

  await snapshot('before-delete')

  // Delete the fastened constraint
  const delR = await api.v1.assembly.deleteConstraint({ ids: [fId] })
  console.log('[01] deleteConstraint result:', delR.result, 'maxLevel:', delR.maxLevel)
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-response')

  // Measure inst2 COG after deletion
  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG after delete:', JSON.stringify(cogAfter?.centerOfGravity))

  await snapshot('after-delete')

  filewrite({ cogBefore: cogBefore?.centerOfGravity, cogAfter: cogAfter?.centerOfGravity }, 'cog-comparison')

  // Try to query the deleted constraint
  const getR = await api.v1.assembly.getFastened({ id: asmId, name: 'Joint' })
  console.log('[01] getFastened after delete - result:', getR.result, 'maxLevel:', getR.maxLevel)
  filewrite({ result: getR.result, messages: getR.messages, maxLevel: getR.maxLevel }, 'get-after-delete')

  return { asmId, fId, foId }
}
