export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Rot',
  })).result

  // Test radians as number
  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Rad',
    mate1: { path: [inst], csys: wcs },
    zRotation: Math.PI / 2,
  })
  console.log('[04b] fastenedOrigin result:', foR.result, 'maxLevel:', foR.maxLevel)
  filewrite({ result: foR.result, messages: foR.messages, maxLevel: foR.maxLevel }, 'fo-radians-response')

  if (foR.result) {
    const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
    console.log('[04b] COG:', JSON.stringify(mass?.cog))
    filewrite(mass, 'mass-radians')
  }

  return {}
}
