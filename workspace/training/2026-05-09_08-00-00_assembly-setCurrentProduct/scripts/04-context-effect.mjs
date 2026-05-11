export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'SmallBox' })).result
  await api.v1.part.box({ id: tpl1, length: 30, width: 20, height: 15 })
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'TallCyl' })).result
  const cylFeat = (await api.v1.part.cylinder({ id: tpl2, radius: 10, height: 60 })).result
  console.log('[04] asmId:', asmId, 'tpl1:', tpl1, 'tpl2:', tpl2, 'cylFeat:', cylFeat)

  // Switch to assembly and create instances
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BoxInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'CylInst',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[04] inst1:', inst1, 'inst2:', inst2)

  await snapshot('before')

  // Switch to tpl2 and modify it via part.* calls
  await api.v1.assembly.setCurrentProduct({ id: tpl2 })
  await api.v1.part.openFeature({ id: cylFeat })
  await api.v1.part.updateCylinder({ id: cylFeat, radius: 25 })
  await api.v1.part.closeFeature({ id: cylFeat })
  await api.v1.common.recalc({})

  // Switch back to assembly to see the change
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await snapshot('after-modify')

  // Verify with mass properties
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] inst1 (box) volume:', massBefore.volume)
  console.log('[04] inst2 (cyl) volume:', massAfter.volume)
  filewrite({ boxVol: massBefore.volume, cylVol: massAfter.volume }, 'volumes')

  return { asmId, tpl1, tpl2, inst1, inst2 }
}
