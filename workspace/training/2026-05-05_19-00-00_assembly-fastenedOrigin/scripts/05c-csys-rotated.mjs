export default async function (api, { snapshot, filewrite }) {
  // Does csys axis orientation affect positioning?
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcsRot = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS_Rot', origin: [0, 0, 0],
    xDirection: [0, 1, 0], yDirection: [-1, 0, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Rot',
    mate1: { path: [inst], csys: wcsRot },
  })
  console.log('[05c] result:', foR.result, 'maxLevel:', foR.maxLevel)

  const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05c] COG with wcsRotated:', JSON.stringify(mass?.cog))
  filewrite(mass, 'mass-csys-rotated')

  await snapshot('csys-rotated')
  return {}
}
