export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 20, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
  })).result

  // Test 1: non-unit but correctly oriented (scaled up)
  const r1 = await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [2, 0, 0], [0, 3, 0]],
  })
  console.log('[06] non-unit vectors result:', r1.result, 'maxLevel:', r1.maxLevel)
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after non-unit:', JSON.stringify(cog1?.cog))

  // Test 2: non-orthogonal vectors (xDir and yDir not perpendicular)
  const r2 = await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [1, 0.5, 0], [0, 1, 0]],
  })
  console.log('[06] non-orthogonal result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'non-orthogonal-response')

  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after non-orthogonal:', JSON.stringify(cog2?.cog))

  // Test 3: zero-length xDir
  const r3 = await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [0, 0, 0], [0, 1, 0]],
  })
  console.log('[06] zero xDir result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'zero-xdir-response')

  // Test 4: collinear xDir and yDir
  const r4 = await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
  })
  console.log('[06] collinear result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'collinear-response')

  // Test 5: left-handed (cross product yields -Z)
  // xDir=[1,0,0], yDir=[0,0,1] → Z = cross(X,Y) = cross([1,0,0],[0,0,1]) = [0,-1,0] (left-handed)
  const r5 = await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [1, 0, 0], [0, 0, 1]],
  })
  console.log('[06] left-handed result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'left-handed-response')

  await snapshot('final')

  return { inst, asmId }
}
