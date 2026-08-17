export default async function (api, { snapshot, filewrite }) {
  // Create assembly + part template with geometry
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  console.log('[01] tplId:', tplId)

  // Build a box in the template
  const boxId = (await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })).result
  console.log('[01] boxId:', boxId)

  // Switch back to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create first instance at origin (default transform)
  const r1 = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst0' })
  console.log('[01] inst0 result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'inst0-response')

  // Create second instance offset in X
  const r2 = await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Inst1',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[01] inst1 result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Create third instance offset in Y with rotation (90° around Z)
  const r3 = await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Inst2',
    transformation: [[0, 60, 0], [0, 1, 0], [-1, 0, 0]],
  })
  console.log('[01] inst2 result:', r3.result, 'maxLevel:', r3.maxLevel)

  await snapshot('three-instances')

  // Spatial verification: use structure tree to check transforms
  filewrite(r1.structure, 'inst0-structure')

  return { asmId, tplId, inst0: r1.result, inst1: r2.result, inst2: r3.result }
}
