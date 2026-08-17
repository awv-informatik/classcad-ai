export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  // Non-cubic box so rotation is visible
  await api.v1.part.box({ id: tplId, name: 'B1', length: 60, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Reference instance — stays fixed
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Ref',
    transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before')

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] assembly COG before:', JSON.stringify(massBefore?.cog))

  // Rotate inst1 by 90° around Z-axis (relative)
  // cos(90°)=0, sin(90°)=1 → R = [[0,-1,0],[1,0,0],[0,0,1]]
  const r = await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [
      [0, -1, 0, 0],
      [1,  0, 0, 0],
      [0,  0, 1, 0],
      [0,  0, 0, 1],
    ],
  })
  console.log('[03] transformInstance result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[03] messages:', JSON.stringify(r.messages))

  await snapshot('after-rotate-90z')

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] assembly COG after:', JSON.stringify(massAfter?.cog))

  filewrite({
    cogBefore: massBefore?.cog,
    cogAfter: massAfter?.cog,
    transformResult: { result: r.result, maxLevel: r.maxLevel },
  }, 'results')

  return { asmId, inst1, inst2 }
}
