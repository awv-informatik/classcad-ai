export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result

  // Try both part and assembly calculateMassProperties
  const partMass = await api.v1.part.calculateMassProperties({ id: inst1 })
  const asmMass = await api.v1.assembly.calculateMassProperties({ id: asmId })

  console.log('[01b] part.calcMass result type:', typeof partMass.result)
  console.log('[01b] part.calcMass maxLevel:', partMass.maxLevel)
  console.log('[01b] asm.calcMass result type:', typeof asmMass.result)
  console.log('[01b] asm.calcMass maxLevel:', asmMass.maxLevel)

  filewrite({ partMass: { result: partMass.result, messages: partMass.messages, maxLevel: partMass.maxLevel } }, 'part-mass')
  filewrite({ asmMass: { result: asmMass.result, messages: asmMass.messages, maxLevel: asmMass.maxLevel } }, 'asm-mass')

  return {}
}
