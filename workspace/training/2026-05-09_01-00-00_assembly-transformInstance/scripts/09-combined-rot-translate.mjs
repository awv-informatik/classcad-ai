export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 60, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Reference
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Ref',
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before')
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG before:', JSON.stringify(massBefore?.cog))

  // Combined: 90° Z rotation + translate [50, 30, 0]
  // R_90z = [[0,-1,0],[1,0,0],[0,0,1]], T = [50,30,0]
  const r = await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [
      [0, -1, 0, 50],
      [1,  0, 0, 30],
      [0,  0, 1, 0],
      [0,  0, 0, 1],
    ],
  })
  console.log('[09] combined result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-rot-translate')
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG after:', JSON.stringify(massAfter?.cog))

  // inst1 was at identity. M × I = M. So inst1 new transform = [[0,-1,0,50],[1,0,0,30],[0,0,1,0],[0,0,0,1]]
  // inst1 local COG [30,10,7.5] → world = R90z × [30,10,7.5] + [50,30,0] = [-10,30,7.5] + [50,30,0] = [40,60,7.5]
  // inst2 world COG = [30,90,7.5]
  // Assembly COG = avg = [(40+30)/2, (60+90)/2, 7.5] = [35, 75, 7.5]
  console.log('[09] expected COG: [35, 75, 7.5]')

  filewrite({
    cogBefore: massBefore?.cog,
    cogAfter: massAfter?.cog,
  }, 'results')

  return { asmId }
}
