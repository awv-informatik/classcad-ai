export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Array form: create multiple instances in one call
  const r = await api.v1.assembly.instance([
    { productId: tplId, ownerId: asmId, name: 'A' },
    { productId: tplId, ownerId: asmId, name: 'B', transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] },
    { productId: tplId, ownerId: asmId, name: 'C', transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]] },
  ])
  console.log('[06] batch result:', JSON.stringify(r.result))
  console.log('[06] batch maxLevel:', r.maxLevel)
  console.log('[06] batch messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  // Verify: result should be Array<id>
  console.log('[06] isArray:', Array.isArray(r.result))
  console.log('[06] count:', r.result?.length)

  await snapshot('batch-three')

  // Verify with root mass
  const rootMass = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[06] root mass:', JSON.stringify(rootMass.result))
  // Expected: 3 boxes, COGs at [20,15,10], [80,15,10], [140,15,10]
  // Combined: [(20+80+140)/3, 15, 10] = [80, 15, 10]
  console.log('[06] predicted COG: [80, 15, 10]')

  return { results: r.result }
}
