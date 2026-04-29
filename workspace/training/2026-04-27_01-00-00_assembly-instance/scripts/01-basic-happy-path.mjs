export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Basic instance creation — minimal params
  const r1 = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })
  console.log('[01] basic instance result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[01] result type:', typeof r1.result)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'basic-result')

  // Instance with name
  const r2 = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Named_1' })
  console.log('[01] named instance result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Instance with transformation (3-point format: [origin, xDir, yDir])
  const r3 = await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Offset_1',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[01] transformed instance result:', r3.result, 'maxLevel:', r3.maxLevel)

  await snapshot('basic-instances')
  return { asmId, tplId, inst1: r1.result, inst2: r2.result, inst3: r3.result }
}
