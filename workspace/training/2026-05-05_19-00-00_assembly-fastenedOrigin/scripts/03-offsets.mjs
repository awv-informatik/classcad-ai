export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instance at arbitrary position
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Offset',
    transformation: [[200, 100, 50], [1, 0, 0], [0, 1, 0]],
  })).result

  // Apply fastenedOrigin with offsets
  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Offset',
    mate1: { path: [inst], csys: wcs },
    xOffset: 60, yOffset: 40, zOffset: 25,
  })
  console.log('[03] fastenedOrigin result:', foR.result, 'maxLevel:', foR.maxLevel)

  // Verify: assembly COG should reflect the offset position
  // part.box is corner-aligned, so box COG in template = [20, 15, 10]
  // With offset [60, 40, 25], expected instance COG = [60+20, 40+15, 25+10] = [80, 55, 35]
  const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG:', JSON.stringify(mass?.cog))
  filewrite(mass, 'mass-with-offset')

  await snapshot('offset-result')
  return { foId: foR.result }
}
