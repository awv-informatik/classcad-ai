export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplA = (await api.v1.assembly.partTemplate({ name: 'PartA' })).result
  await api.v1.part.box({ id: tplA, name: 'B1', length: 20, width: 15, height: 10 })

  const tplB = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const inner1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: tplB, name: 'InnerA',
  })).result
  const inner2 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: tplB, name: 'InnerB',
    transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[13] inner instances:', inner1, inner2)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly
  const subInst = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'SubInst',
  })).result

  // Can we query children of this instance?
  const r1 = await api.v1.assembly.getInstance({ ownerId: subInst })
  console.log('[13] children of subInst:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Get by name from instance
  const r2 = await api.v1.assembly.getInstance({ ownerId: subInst, name: 'InnerA' })
  console.log('[13] InnerA from subInst:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Get by name from template (for comparison)
  const r3 = await api.v1.assembly.getInstance({ ownerId: tplB })
  console.log('[13] children of tplB:', JSON.stringify(r3.result))

  // Are the instance IDs the same (template vs instance query)?
  console.log('[13] template children == instance children?',
    JSON.stringify(r1.result) === JSON.stringify(r3.result))

  filewrite({
    fromInstance: r1.result,
    fromTemplate: r3.result,
    sameIds: JSON.stringify(r1.result) === JSON.stringify(r3.result),
  }, 'getInstance-comparison')

  await snapshot('sub-instances')
  return { subInst }
}
