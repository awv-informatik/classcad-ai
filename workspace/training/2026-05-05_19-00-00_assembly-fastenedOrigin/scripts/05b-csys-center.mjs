export default async function (api, { snapshot, filewrite }) {
  // Does csys origin affect positioning? Test with csys at box center [20,15,10]
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcsCenter = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS_Center', origin: [20, 15, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Center',
    mate1: { path: [inst], csys: wcsCenter },
  })
  console.log('[05b] result:', foR.result, 'maxLevel:', foR.maxLevel)
  filewrite({ result: foR.result, messages: foR.messages, maxLevel: foR.maxLevel }, 'fo-response')

  const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05b] COG with wcsCenter:', JSON.stringify(mass?.cog))
  filewrite(mass, 'mass-csys-center')

  // If csys has NO effect: COG should be [20,15,10] (same as wcsOrigin test)
  // If csys acts as mounting point: the csys origin aligns with assembly origin,
  // so box would be shifted to [-20,-15,-10]→[20,15,10], COG at [0,0,0]

  await snapshot('csys-center')
  return {}
}
