export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test: left-handed matrix (docs say "not yet supported")
  // A left-handed matrix has det(R) = -1 (e.g. a mirror)
  // Mirror across YZ plane: [[−1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
  const r1 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'LeftHanded',
    transformation: [[-1, 0, 0, 80], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
  })
  console.log('[14] left-handed result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[14] msgs:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'left-handed-response')

  // Normal reference
  const r2 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Normal',
  })

  if (r1.result) {
    await snapshot('left-handed')
    const rootMass = await api.v1.assembly.calculateMassProperties({ id: asmId })
    console.log('[14] root mass:', JSON.stringify(rootMass.result))
    // If left-handed is rejected, only normal at origin: COG=[20,15,10]
    // If left-handed works as mirror: mirrored box at [80,0,0] with flipped X
    //   local COG [20,15,10] → mirrored X: [-20,15,10] + translation [80,0,0] = [60,15,10]
    //   Combined: [(20+60)/2, 15, 10] = [40, 15, 10], vol=48000
    // If left-handed is auto-corrected to right-handed (like common.transformObjectWithMatrix)
    //   probably identity rotation at [80,0,0]: COG=[100,15,10]
    //   Combined: [(20+100)/2, 15, 10] = [60, 15, 10], vol=48000
  }

  return {}
}
