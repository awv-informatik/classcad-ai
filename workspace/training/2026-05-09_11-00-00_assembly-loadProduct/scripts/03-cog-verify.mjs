// Fix COG measurement — dump full result to find the right field
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Plate' })).result
  await api.v1.part.box({ id: partId, name: 'Body', length: 60, width: 40, height: 20 })

  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const ofbData = saved.result.content

  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.loadProduct({ data: ofbData, format: 'OFB', encoding: 'base64', compression: 'deflate' })).result.id

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Try part.calculateMassProperties and dump full result
  const partMass1 = await api.v1.part.calculateMassProperties({ id: inst1 })
  console.log('[03] part.calcMass inst1 maxLevel:', partMass1.maxLevel)
  filewrite(partMass1.result, 'part-mass-inst1')

  // Try assembly.calculateMassProperties
  const asmMass1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[03] asm.calcMass inst1 maxLevel:', asmMass1.maxLevel)
  filewrite(asmMass1.result, 'asm-mass-inst1')

  const asmMass2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[03] asm.calcMass inst2 maxLevel:', asmMass2.maxLevel)
  filewrite(asmMass2.result, 'asm-mass-inst2')

  return { inst1, inst2 }
}
