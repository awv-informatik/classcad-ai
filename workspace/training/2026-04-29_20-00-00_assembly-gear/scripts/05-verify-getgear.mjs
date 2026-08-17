export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearVerify' })).result

  const mkTemplate = async (name) => {
    const tpl = (await api.v1.assembly.partTemplate({ name })).result
    await api.v1.part.cylinder({ id: tpl, name: 'Cyl', height: 10, diameter: 20 })
    const wcs = (await api.v1.part.workCSys({
      id: tpl, name: 'Axis', origin: [0, 0, 5],
      xDirection: [1, 0, 0], yDirection: [0, 1, 0],
    })).result
    return { tpl, wcs }
  }

  const t1 = await mkTemplate('A')
  const t2 = await mkTemplate('B')
  const t3 = await mkTemplate('C')

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: t1.tpl, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: t2.tpl, ownerId: asmId, name: 'I2', transformation: [[25, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: t3.tpl, ownerId: asmId, name: 'I3', transformation: [[-25, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: t1.wcs } })

  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev1', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst2], csys: t2.wcs } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev2', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst3], csys: t3.wcs } })).result

  const gearR = await api.v1.assembly.gear({ id: asmId, name: 'TestGear', constr1Id: rev1, constr2Id: rev2, ratio: 2, offset: '30deg' })
  const gearId = gearR.result
  console.log('[05] gear created:', gearId)

  // Retrieve it with getGear
  const get1 = await api.v1.assembly.getGear({ id: asmId, name: 'TestGear' })
  console.log('[05] getGear result:', JSON.stringify(get1.result))
  console.log('[05] getGear maxLevel:', get1.maxLevel)
  filewrite(get1.result, 'getgear-result')

  // Try getGear with wrong name
  const get2 = await api.v1.assembly.getGear({ id: asmId, name: 'NonExistent' })
  console.log('[05] getGear not found:', get2.result, 'maxLevel:', get2.maxLevel)
  filewrite({ result: get2.result, messages: get2.messages, maxLevel: get2.maxLevel }, 'getgear-notfound')

  // Check structure for gear presence
  const structR = await api.v1.assembly.gear({ id: asmId, name: 'TestGear2', constr1Id: rev1, constr2Id: rev2, ratio: 0.5 })
  // Dump structure to see where gears live in the tree
  const structDump = structR.structure
  filewrite(structDump, 'structure-with-gears')

  return { gearId, getResult: get1.result }
}
