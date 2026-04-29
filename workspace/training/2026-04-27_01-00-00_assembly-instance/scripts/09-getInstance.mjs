export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GetInstAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 20, width: 20, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const i1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })).result
  const i2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'B' })).result
  const i3 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'C' })).result

  // Get all instances
  const rAll = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[09] all:', rAll.result)

  // Get by name
  const rB = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'B' })
  console.log('[09] by name "B":', rB.result, '(expected:', i2, ')')

  // Get nonexistent
  const rNone = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Z' })
  console.log('[09] nonexistent:', rNone.result, 'maxLevel:', rNone.maxLevel)

  // Batch getInstance
  const rBatch = await api.v1.assembly.getInstance([
    { ownerId: asmId, name: 'A' },
    { ownerId: asmId, name: 'C' },
  ])
  console.log('[09] batch:', rBatch.result)

  // Get with invalid ownerId type (part template)
  const rBad = await api.v1.assembly.getInstance({ ownerId: tplId })
  console.log('[09] invalid owner (part tpl):', rBad.result, 'maxLevel:', rBad.maxLevel)
  if (rBad.messages?.length) console.log('[09]   msg:', rBad.messages[0].message)

  // Get with no params
  const rEmpty = await api.v1.assembly.getInstance({})
  console.log('[09] no params:', rEmpty.result, 'maxLevel:', rEmpty.maxLevel)
  if (rEmpty.messages?.length) console.log('[09]   msg:', rEmpty.messages[0].message)

  filewrite({
    all: rAll.result,
    byName: rB.result,
    nonexistent: rNone.result,
    batch: rBatch.result,
    invalidOwner: { result: rBad.result, msg: rBad.messages?.[0]?.message },
    noParams: { result: rEmpty.result, msg: rEmpty.messages?.[0]?.message },
  }, 'getInstance-results')

  return { asmId }
}
